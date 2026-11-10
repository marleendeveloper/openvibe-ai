import type { ProviderId } from "./providers";
import { LIMITS, byteSize } from "./limits";
import { ownerHeaders } from "./provider-client";

export type ContentPart =
  { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string | ContentPart[] };

export async function streamChat(opts: {
  provider: ProviderId;
  model: string;
  messages: ChatMsg[];
  temperature?: number;
  maxTokens?: number;
  zeroCostOnly?: boolean;
  signal?: AbortSignal;
  onToken: (t: string) => void;
}): Promise<string> {
  const res = await fetch("/api/public/ai", {
    method: "POST",
    signal: opts.signal ?? null,
    headers: {
      "content-type": "application/json",
      ...(await ownerHeaders()),
    },
    body: JSON.stringify({
      provider: opts.provider,
      model: opts.model,
      messages: opts.messages,
      stream: true,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 8192,
      zeroCostOnly: opts.zeroCostOnly ?? true,
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    let message = t;
    try {
      message = JSON.parse(t).error ?? t;
    } catch {
      /* plain upstream response */
    }
    throw new Error(message || `HTTP ${res.status}: ${res.statusText}`);
  }
  if (!res.headers.get("content-type")?.includes("text/event-stream")) {
    const j = await res.json();
    const content = j.choices?.[0]?.message?.content;
    if (j.error || typeof content !== "string")
      throw new Error(j.error?.message ?? "Ungültige KI-Antwort.");
    if (byteSize(content) > LIMITS.responseBytes) throw new Error("KI-Antwort ist zu groß.");
    opts.onToken(content);
    return content;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  let inReasoning = false;
  let received = 0;
  let finished = false;
  const event = (lines: string[]) => {
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n")
      .trim();
    if (!data) return;
    if (data === "[DONE]") {
      finished = true;
      return;
    }
    let j;
    try {
      j = JSON.parse(data);
    } catch {
      throw new Error("Ungültiges SSE-Ereignis vom Anbieter.");
    }
    if (j.error) throw new Error(typeof j.error === "string" ? j.error : j.error.message);
    const choice = j.choices?.[0];
    if (choice?.finish_reason === "length")
      throw new Error(
        "Tokenlimit erreicht: Antwort unvollständig. Max Tokens erhöhen oder Aufgabe verkleinern.",
      );
    if (choice?.finish_reason) finished = true;
    const d = choice?.delta ?? {};
    const reasoning = d.reasoning_content ?? d.reasoning;
    if (typeof reasoning === "string" && reasoning) {
      if (!inReasoning) {
        opts.onToken("<think>");
        inReasoning = true;
      }
      opts.onToken(reasoning);
    }
    if (typeof d.content === "string") {
      if (inReasoning) {
        opts.onToken("</think>");
        inReasoning = false;
      }
      full += d.content;
      opts.onToken(d.content);
    }
  };
  let lines: string[] = [];
  try {
    for (;;) {
      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const { done, value } = await reader.read();
      received += value?.length ?? 0;
      if (received > LIMITS.responseBytes) throw new Error("KI-Antwort ist zu groß.");
      buf += dec.decode(value, { stream: !done });
      const complete = buf.split("\n");
      buf = complete.pop() ?? "";
      for (const line of complete) {
        const l = line.replace(/\r$/, "");
        if (!l) {
          event(lines);
          lines = [];
        } else lines.push(l);
      }
      if (done) {
        if (buf) lines.push(buf.replace(/\r$/, ""));
        if (lines.length) event(lines);
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  if (inReasoning) opts.onToken("</think>");
  if (!finished)
    throw new Error("KI-Verbindung wurde vor Abschluss unterbrochen. Keine Dateien angewendet.");
  if (!full.trim()) throw new Error("Der Anbieter hat keinen Antworttext geliefert.");
  return full;
}
