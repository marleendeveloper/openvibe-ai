import { PROXY_HOSTS } from "./providers";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export async function streamChat(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMsg[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onToken: (t: string) => void;
}): Promise<string> {
  const target = opts.baseUrl.replace(/\/+$/, "") + "/chat/completions";
  const host = new URL(target).hostname;
  const viaProxy = PROXY_HOSTS.includes(host);
  const res = await fetch(viaProxy ? "/api/public/ai" : target, {
    method: "POST",
    signal: opts.signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.apiKey}`,
      ...(viaProxy ? { "x-target-url": target } : {}),
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: true,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 8192,
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${t.slice(0, 400) || res.statusText}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  let inReasoning = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith("data:")) continue;
      const data = l.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        if (j.error) throw new Error(typeof j.error === "string" ? j.error : j.error.message);
        const d = j.choices?.[0]?.delta ?? {};
        const r: string | undefined = d.reasoning_content ?? d.reasoning;
        if (r) {
          if (!inReasoning) { opts.onToken("<think>"); inReasoning = true; }
          opts.onToken(r);
        }
        if (d.content) {
          if (inReasoning) { opts.onToken("</think>"); inReasoning = false; }
          full += d.content;
          opts.onToken(d.content);
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  if (inReasoning) opts.onToken("</think>");
  return full;
}
