import { useEffect, useState, useMemo } from "react";
import { SandpackProvider, SandpackPreview, useSandpack, useSandpackConsole } from "@codesandbox/sandpack-react";
import { Monitor, Smartphone, RotateCw, Wrench, Trash2 } from "lucide-react";
import { useProject } from "@/lib/studio/store";
import { useRuntime } from "@/lib/studio/runtime";
import { runAgent } from "@/lib/studio/agent";
import { Btn } from "./ui";
import { cn } from "@/lib/utils";
import { filesRevision } from "@/lib/studio/preview-state";

function Listener({ projectId, revision }: { projectId: string; revision: string }) {
  const { sandpack, listen } = useSandpack();
  const { logs, reset } = useSandpackConsole({ resetOnPreviewRestart: true, maxMessageCount: 200 });
  const setError = useRuntime((s) => s.setError);
  const setLogs = useRuntime((s) => s.setLogs);
  const setPreview = useRuntime((s) => s.setPreview);
  useEffect(() => {
    setPreview({ projectId, revision, status: "loading", error: null });
    return listen((message) => {
      if (message.type === "success") setPreview({ projectId, revision, status: "ready", error: null });
      if (message.type === "action" && message.action === "show-error") {
        const error = [message.title, message.message].filter(Boolean).join("\n");
        setPreview({ projectId, revision, status: "error", error: error || "Vorschaufehler" });
      }
    });
  }, [projectId, revision, listen, setPreview]);
  useEffect(() => {
    if (sandpack.error) setPreview({ projectId, revision, status: "error", error: `${sandpack.error.title ?? ""}\n${sandpack.error.message}`.trim() });
  }, [sandpack.error, projectId, revision, setPreview]);
  useEffect(() => {
    setLogs(logs.map((l) => ({ level: l.method, text: (l.data ?? []).map((d) => (typeof d === "string" ? d : JSON.stringify(d))).join(" "), at: Date.now() })));
    const errs = logs.filter((l) => l.method === "error");
    if (errs.length && !sandpack.error) setPreview({ projectId, revision, status: "error", error: errs.slice(-3).map((l) => (l.data ?? []).join(" ")).join("\n") });
  }, [logs, setLogs, setError, sandpack.error, projectId, revision, setPreview]);
  useEffect(() => { (window as unknown as { __resetConsole?: () => void }).__resetConsole = reset; }, [reset]);
  return null;
}

export function Preview() {
  const project = useProject();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [tab, setTab] = useState<"preview" | "console">("preview");
  const [k, setK] = useState(0);
  const error = useRuntime((s) => s.error);
  const logs = useRuntime((s) => s.logs);
  const busy = useRuntime((s) => s.busy);
  const revision = useMemo(() => filesRevision(project.files), [project.files]);

  let deps: Record<string, string> = {};
  try { deps = JSON.parse(project.files["/package.json"] ?? "{}").dependencies ?? {}; } catch { /* invalid json */ }
  const files = Object.fromEntries(Object.entries(project.files).filter(([p]) => p !== "/package.json"));

  return (
    <SandpackProvider key={project.id + k + JSON.stringify(deps)} template="react-ts" files={files} customSetup={{ dependencies: deps }} theme="dark" options={{ recompileMode: "delayed", recompileDelay: 400 }}>
      <Listener projectId={project.id} revision={revision} />
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-1 border-b px-2 py-1.5">
          <Btn className={cn(tab === "preview" && "text-foreground bg-accent")} onClick={() => setTab("preview")}>Preview</Btn>
          <Btn className={cn(tab === "console" && "text-foreground bg-accent")} onClick={() => setTab("console")}>
            Konsole {error ? <span className="size-2 rounded-full bg-destructive" /> : null}
          </Btn>
          <div className="ml-auto flex gap-1">
            <Btn title="Desktop" className={cn(device === "desktop" && "text-primary")} onClick={() => setDevice("desktop")}><Monitor size={15} /></Btn>
            <Btn title="Mobil" className={cn(device === "mobile" && "text-primary")} onClick={() => setDevice("mobile")}><Smartphone size={15} /></Btn>
            <Btn title="Neu laden" onClick={() => setK((x) => x + 1)}><RotateCw size={15} /></Btn>
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2 border-b bg-destructive/10 px-3 py-2 text-xs">
            <pre className="flex-1 whitespace-pre-wrap font-mono text-destructive line-clamp-4">{error}</pre>
            <Btn variant="danger" className="h-7 shrink-0" disabled={busy} onClick={() => runAgent(`Die Preview meldet diesen Fehler. Analysiere und behebe ihn:\n\n${error}`)}>
              <Wrench size={13} /> Fix
            </Btn>
          </div>
        )}
        <div className={cn("min-h-0 flex-1", tab !== "preview" && "hidden")}>
          <div className={cn("mx-auto h-full", device === "mobile" && "max-w-[390px] border-x")}>
            <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} style={{ height: "100%" }} />
          </div>
        </div>
        {tab === "console" && (
          <div className="min-h-0 flex-1 overflow-auto p-2 font-mono text-xs">
            <div className="mb-2 flex justify-end"><Btn onClick={() => (window as unknown as { __resetConsole?: () => void }).__resetConsole?.()}><Trash2 size={13} /> Leeren</Btn></div>
            {logs.length === 0 && <p className="text-muted-foreground">Keine Ausgaben.</p>}
            {logs.map((l, i) => (
              <div key={i} className={cn("border-b border-border/50 py-1 whitespace-pre-wrap", l.level === "error" ? "text-destructive" : l.level === "warn" ? "text-primary" : "text-muted-foreground")}>{l.text}</div>
            ))}
          </div>
        )}
      </div>
    </SandpackProvider>
  );
}
