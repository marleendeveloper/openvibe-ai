import { streamChat, type ChatMsg } from "./ai";
import { parseFileOps } from "./parse";
import { PROVIDERS } from "./providers";
import { useStudio, uid, type Message } from "./store";
import { useRuntime } from "./runtime";

let controller: AbortController | null = null;
export const stopAgent = () => controller?.abort();

function projectContext(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([p, c]) => `<file path="${p}">\n${c}\n</file>`)
    .join("\n\n");
}

const waitForPreview = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runAgent(prompt: string, depth = 0): Promise<void> {
  const st = useStudio.getState();
  const s = st.settings;
  const project = st.projects.find((p) => p.id === st.currentId)!;
  const baseUrl = s.provider === "custom" ? s.customBaseUrl : PROVIDERS[s.provider].baseUrl;
  const apiKey = s.keys[s.provider];
  const rt = useRuntime.getState();

  st.addMessage({ id: uid(), role: depth ? "system" : "user", content: prompt });
  const aid = uid();
  st.addMessage({ id: aid, role: "assistant", content: "" });

  if (!apiKey || !baseUrl || !s.model) {
    st.updateMessage(aid, { error: "Bitte zuerst API-Key, Provider und Modell in den Einstellungen setzen." });
    return;
  }

  const agent = s.mode === "agent";
  const sys = [agent ? s.agentPrompt : s.chatPrompt, s.modelPrompts[s.model]].filter(Boolean).join("\n\n");
  const history: ChatMsg[] = project.messages
    .filter((m) => m.content && m.role !== "system")
    .slice(-10)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  const userContent = agent
    ? `Current project files:\n\n${projectContext(project.files)}\n\n---\nTask:\n${prompt}`
    : prompt;

  controller = new AbortController();
  rt.setBusy(true);
  let acc = "";
  try {
    await streamChat({
      baseUrl,
      apiKey,
      model: s.model,
      temperature: s.temperature,
      maxTokens: s.maxTokens,
      signal: controller.signal,
      messages: [{ role: "system", content: sys }, ...history, { role: "user", content: userContent }],
      onToken: (t) => {
        acc += t;
        useStudio.getState().updateMessage(aid, { content: acc });
      },
    });
  } catch (e) {
    const msg = (e as Error).name === "AbortError" ? "Abgebrochen." : (e as Error).message;
    useStudio.getState().updateMessage(aid, { error: msg });
    rt.setBusy(false);
    return;
  }
  rt.setBusy(false);

  if (!agent) return;
  const clean = acc.replace(/<think>[\s\S]*?<\/think>/g, "");
  const ops = parseFileOps(clean);
  if (!ops.length) return;
  const patch: Partial<Message> = { ops, opsStatus: "pending" };
  useStudio.getState().updateMessage(aid, patch);
  if (!s.autoApply) return;
  applyMessageOps(aid);

  if (s.autoFix && depth < 2) {
    useRuntime.getState().setError(null);
    await waitForPreview(6000);
    const err = useRuntime.getState().error;
    if (err) await runAgent(`Die Preview meldet diesen Fehler. Analysiere und behebe ihn:\n\n${err}`, depth + 1);
  }
}

export function applyMessageOps(id: string) {
  const st = useStudio.getState();
  const p = st.projects.find((x) => x.id === st.currentId)!;
  const m = p.messages.find((x) => x.id === id);
  if (!m?.ops) return;
  st.applyOps(m.ops, `KI: ${m.ops.length} Datei(en)`);
  st.updateMessage(id, { opsStatus: "applied" });
}
