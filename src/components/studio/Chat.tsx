import { useEffect, useRef, useState } from "react";
import { Send, Square, Check, X, History, Eraser, Bot, MessageSquare, Undo2 } from "lucide-react";
import { PROVIDERS } from "@/lib/studio/providers";
import { useProject, useStudio, type Message } from "@/lib/studio/store";
import { useRuntime } from "@/lib/studio/runtime";
import { runAgent, stopAgent, applyMessageOps } from "@/lib/studio/agent";
import { summarizeResponse } from "@/lib/studio/parse";
import { Btn } from "./ui";
import { cn } from "@/lib/utils";

function Bubble({ m }: { m: Message }) {
  const updateMessage = useStudio((s) => s.updateMessage);
  const [showThink, setShowThink] = useState(false);
  const think = m.content.match(/<think>([\s\S]*?)(<\/think>|$)/)?.[1];
  const body = summarizeResponse(m.content.replace(/<think>[\s\S]*?(<\/think>|$)/g, "")).trim();
  if (m.role === "user" || m.role === "system")
    return (
      <div className={cn("ml-auto max-w-[88%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap", m.role === "user" ? "bg-secondary" : "border border-destructive/40 text-xs font-mono text-muted-foreground")}>
        {m.role === "system" ? "🔧 Auto-Fix: " : ""}{m.content.length > 600 ? m.content.slice(0, 600) + "…" : m.content}
      </div>
    );
  return (
    <div className="max-w-full space-y-2 text-sm">
      {think && (
        <Btn onClick={() => setShowThink(!showThink)} className="text-xs">
          {showThink ? "▾" : "▸"} Gedankengang
        </Btn>
      )}
      {showThink && think && <pre className="max-h-60 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap text-muted-foreground">{think}</pre>}
      {body ? <div className="whitespace-pre-wrap leading-relaxed">{body}</div> : !m.error && <span className="animate-pulse text-primary">●●●</span>}
      {m.error && <div className="rounded border border-destructive/50 bg-destructive/10 p-2 font-mono text-xs text-destructive whitespace-pre-wrap">{m.error}</div>}
      {m.ops && (
        <div className="rounded-lg border bg-card p-2">
          <div className="mb-1 text-xs text-muted-foreground">
            {m.ops.length} Änderung(en) · {m.opsStatus === "applied" ? <span className="text-success">angewendet</span> : m.opsStatus === "rejected" ? "verworfen" : "wartet auf Bestätigung"}
          </div>
          <ul className="font-mono text-xs">
            {m.ops.map((o, i) => <li key={i} className={o.type === "delete" ? "text-destructive" : "text-foreground"}>{o.type === "delete" ? "− " : "+ "}{o.path}</li>)}
          </ul>
          {m.opsStatus === "pending" && (
            <div className="mt-2 flex gap-2">
              <Btn variant="primary" onClick={() => { try { applyMessageOps(m.id); } catch (e) { updateMessage(m.id, { error: (e as Error).message }); } }}><Check size={14} /> Anwenden</Btn>
              <Btn variant="outline" onClick={() => updateMessage(m.id, { opsStatus: "rejected" })}><X size={14} /> Verwerfen</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Chat() {
  const project = useProject();
  const { settings, setSettings, clearChat, restore, undo } = useStudio();
  const busy = useRuntime((s) => s.busy);
  const progress = useRuntime((s) => s.progress);
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [project.messages]);

  const send = () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    void runAgent(t);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
        <div className="flex rounded-md border p-0.5">
          <Btn className={cn("h-7", settings.mode === "agent" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")} onClick={() => setSettings({ mode: "agent" })}><Bot size={14} /> Agent</Btn>
          <Btn className={cn("h-7", settings.mode === "chat" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")} onClick={() => setSettings({ mode: "chat" })}><MessageSquare size={14} /> Chat</Btn>
        </div>
        <label className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={settings.autoApply} onChange={(e) => setSettings({ autoApply: e.target.checked })} className="accent-primary" /> Auto-Anwenden
        </label>
        <label className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <input type="checkbox" checked={settings.autoFix} onChange={(e) => setSettings({ autoFix: e.target.checked })} className="accent-primary" /> Auto-Fix
        </label>
        <div className="ml-auto flex">
          <Btn title="Letzte Änderung rückgängig" disabled={busy || !project.history.length} onClick={undo}><Undo2 size={15} /></Btn>
          <Btn title="Änderungshistorie" onClick={() => setShowHistory(!showHistory)} className={cn(showHistory && "text-primary")}><History size={15} /></Btn>
          <Btn title="Chat leeren" onClick={() => confirm("Chatverlauf leeren?") && clearChat()}><Eraser size={15} /></Btn>
        </div>
      </div>
      {settings.mode === "agent" && <label className="flex items-start gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={settings.shareProject} onChange={(e) => setSettings({ shareProject: e.target.checked })} className="mt-0.5 accent-primary" />
        <span>Projektdateien und letzte Chatnachrichten an {PROVIDERS[settings.provider].name} senden. Projekte bleiben lokal; die Vorschau nutzt Sandpack-Dienste.</span>
      </label>}
      {progress.length > 0 && <details className="border-b px-3 py-2 text-xs" open={busy}>
        <summary className="cursor-pointer text-primary break-words">{progress[progress.length - 1]}</summary>
        <ol className="mt-2 space-y-1 text-muted-foreground">{progress.slice(0, -1).map((step, i) => <li key={i}>{i + 1}. {step}</li>)}</ol>
      </details>}

      {showHistory && (
        <div className="max-h-56 overflow-auto border-b bg-panel p-2 text-xs">
          {project.history.length === 0 && <p className="text-muted-foreground">Noch keine Snapshots.</p>}
          {project.history.map((h) => (
            <div key={h.id} className="flex items-center gap-2 py-1">
              <span className="text-muted-foreground">{new Date(h.at).toLocaleTimeString()}</span>
              <span className="flex-1 truncate">{h.label}</span>
              <Btn className="h-6" disabled={busy} variant="outline" onClick={() => confirm("Diesen Stand wiederherstellen?") && restore(h.id)}>Wiederherstellen</Btn>
            </div>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
        {project.messages.length === 0 && (
          <div className="mt-10 space-y-2 text-center text-sm text-muted-foreground">
            <p className="font-mono text-primary">openvibe://ready</p>
            <p>Beschreibe, was gebaut werden soll. Im Agent-Modus schreibt die KI direkt die Dateien.</p>
          </div>
        )}
        {project.messages.map((m) => <Bubble key={m.id} m={m} />)}
        <div ref={endRef} />
      </div>

      <div className="border-t p-2">
        <div className="flex items-end gap-2 rounded-lg border bg-background p-1.5 focus-within:border-ring">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            rows={2}
            placeholder={settings.mode === "agent" ? "Baue mir eine Landingpage für…" : "Frag etwas…"}
            className="max-h-48 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1 outline-none"
          />
          {busy ? (
            <Btn variant="danger" className="h-10 w-10" onClick={stopAgent} title="Stopp"><Square size={16} /></Btn>
          ) : (
            <Btn variant="primary" className="h-10 w-10 shrink-0" onClick={send} disabled={!input.trim() || (settings.mode === "agent" && !settings.shareProject)} title="Senden (⌘/Strg+Enter)"><Send size={16} /></Btn>
          )}
        </div>
        <p className="mt-1 truncate px-1 font-mono text-[11px] text-muted-foreground">{settings.model}</p>
      </div>
    </div>
  );
}
