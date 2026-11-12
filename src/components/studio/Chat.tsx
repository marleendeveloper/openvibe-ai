import { useEffect, useRef, useState } from "react";
import {
  Send,
  Square,
  Check,
  X,
  History,
  Eraser,
  Bot,
  MessageSquare,
  Undo2,
  ImagePlus,
  RotateCw,
  Sparkles,
  FileCode2,
} from "lucide-react";
import { TEMPLATES, EXAMPLE_PROMPTS } from "@/lib/studio/templates";
import { validateImageFile, freeVisionModel } from "@/lib/studio/phase5";
import { loadProvider } from "@/lib/studio/provider-client";
import type { ModelInfo } from "@/lib/studio/providers";
import { PROVIDERS } from "@/lib/studio/providers";
import { useProject, useStudio, type Message } from "@/lib/studio/store";
import { useRuntime } from "@/lib/studio/runtime";
import { runAgent, stopAgent, applyMessageOps } from "@/lib/studio/agent";
import { summarizeResponse } from "@/lib/studio/parse";
import { Btn } from "./ui";
import { cn } from "@/lib/utils";

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

const PHASES = [
  ["plan", "Planen"],
  ["write", "Schreiben"],
  ["check", "Prüfen"],
  ["done", "Fertig"],
] as const;
function PhaseBar() {
  const phase = useRuntime((s) => s.phase);
  if (!phase) return null;
  const idx = PHASES.findIndex(([id]) => id === phase);
  return (
    <div className="flex items-center gap-1 px-3 pt-2" aria-label="Fortschritt">
      {PHASES.map(([id, label], i) => (
        <div key={id} className="flex flex-1 flex-col gap-1">
          <div
            className={cn(
              "h-1 rounded-full bg-muted transition-colors duration-500",
              i < idx && "bg-primary",
              i === idx && (phase === "done" ? "bg-success" : "brand-gradient shimmer"),
            )}
          />
          <span
            className={cn(
              "text-[10px]",
              i === idx ? "text-primary font-semibold" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Bubble({ m, onRetry }: { m: Message; onRetry?: () => void }) {
  const updateMessage = useStudio((s) => s.updateMessage);
  const [showThink, setShowThink] = useState(false);
  const think = m.content.match(/<think>([\s\S]*?)(<\/think>|$)/)?.[1];
  const body = summarizeResponse(m.content.replace(/<think>[\s\S]*?(<\/think>|$)/g, "")).trim();
  if (m.role === "user" || m.role === "system")
    return (
      <div
        className={cn(
          "msg-in ml-auto max-w-[88%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm whitespace-pre-wrap",
          m.role === "user"
            ? "brand-gradient text-primary-foreground shadow-[0_6px_24px_-10px_var(--primary)]"
            : "border border-destructive/40 text-xs font-mono text-muted-foreground",
        )}
      >
        {m.role === "system" ? "🔧 Auto-Fix: " : ""}
        {m.content.length > 600 ? m.content.slice(0, 600) + "…" : m.content}
        {m.images ? (
          <span className="mt-1 flex items-center gap-1 text-xs opacity-80">
            <ImagePlus size={12} /> {m.images} Bild(er) angehängt
          </span>
        ) : null}
      </div>
    );
  return (
    <div className="msg-in max-w-full space-y-2 rounded-2xl rounded-bl-md border bg-card/70 p-3 text-sm">
      {think && (
        <Btn onClick={() => setShowThink(!showThink)} className="text-xs">
          {showThink ? "▾" : "▸"} Gedankengang
        </Btn>
      )}
      {showThink && think && (
        <pre className="max-h-60 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap text-muted-foreground">
          {think}
        </pre>
      )}
      {body ? (
        <div className="whitespace-pre-wrap leading-relaxed">{body}</div>
      ) : (
        !m.error && (
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        )
      )}
      {m.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
          <p className="font-mono whitespace-pre-wrap">{m.error}</p>
          {onRetry && (
            <Btn variant="outline" className="mt-2 h-7 text-foreground" onClick={onRetry}>
              <RotateCw size={13} />{" "}
              {m.resume ? `Ab Schritt ${m.resume.failedStep + 1} fortsetzen` : "Erneut versuchen"}
            </Btn>
          )}
        </div>
      )}
      {m.ops && (
        <div className="rounded-lg border bg-card p-2">
          <div className="mb-1 text-xs text-muted-foreground">
            {m.ops.length} Änderung(en) ·{" "}
            {m.opsStatus === "applied" ? (
              <span className="text-success">angewendet</span>
            ) : m.opsStatus === "rejected" ? (
              "verworfen"
            ) : (
              "wartet auf Bestätigung"
            )}
          </div>
          <ul className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {m.ops.map((o, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5",
                  o.type === "delete"
                    ? "border-destructive/50 text-destructive"
                    : "border-primary/40 bg-primary/10 text-foreground",
                )}
              >
                <FileCode2 size={11} />
                {o.type === "delete" ? "− " : ""}
                {o.path.replace(/^\//, "")}
              </li>
            ))}
          </ul>
          {m.opsStatus === "pending" && (
            <div className="mt-2 flex gap-2">
              <Btn
                variant="primary"
                onClick={() => {
                  try {
                    applyMessageOps(m.id);
                  } catch (e) {
                    updateMessage(m.id, { error: (e as Error).message });
                  }
                }}
              >
                <Check size={14} /> Anwenden
              </Btn>
              <Btn variant="outline" onClick={() => updateMessage(m.id, { opsStatus: "rejected" })}>
                <X size={14} /> Verwerfen
              </Btn>
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imgNote, setImgNote] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const createProject = useStudio((s) => s.createProject);
  useEffect(() => {
    loadProvider(settings.provider)
      .then((st) => setModels(st.models))
      .catch(() => undefined);
  }, [settings.provider]);
  const currentVision = models.find((m) => m.id === settings.model)?.vision;
  const visionModel = currentVision ? settings.model : freeVisionModel(models);
  const imagesAllowed = settings.provider === "openrouter" && !!visionModel;
  const lastUser = [...project.messages].reverse().find((m) => m.role === "user");
  const pick = async (list: FileList | null) => {
    setImgNote("");
    const next = [...images];
    for (const f of Array.from(list ?? [])) {
      const err = validateImageFile(f, next.length);
      if (err) {
        setImgNote(err);
        break;
      }
      try {
        next.push(await compressImage(f));
      } catch {
        setImgNote("Bild konnte nicht gelesen werden.");
      }
    }
    setImages(next);
    if (fileRef.current) fileRef.current.value = "";
  };
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [project.messages]);

  const send = () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    const imgs = images;
    setImages([]);
    void runAgent(t, imgs, imgs.length && visionModel !== settings.model ? visionModel : undefined);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
        <div className="flex rounded-md border p-0.5">
          <Btn
            className={cn(
              "h-7",
              settings.mode === "agent" &&
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
            onClick={() => setSettings({ mode: "agent" })}
          >
            <Bot size={14} /> Agent
          </Btn>
          <Btn
            className={cn(
              "h-7",
              settings.mode === "chat" &&
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
            onClick={() => setSettings({ mode: "chat" })}
          >
            <MessageSquare size={14} /> Chat
          </Btn>
        </div>
        <label className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={settings.autoApply}
            onChange={(e) => setSettings({ autoApply: e.target.checked })}
            className="accent-primary"
          />{" "}
          Auto-Anwenden
        </label>
        <label className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={settings.autoFix}
            onChange={(e) => setSettings({ autoFix: e.target.checked })}
            className="accent-primary"
          />{" "}
          Auto-Fix
        </label>
        <div className="ml-auto flex">
          <Btn
            title="Letzte Änderung rückgängig"
            disabled={busy || !project.history.length}
            onClick={undo}
          >
            <Undo2 size={15} />
          </Btn>
          <Btn
            title="Änderungshistorie"
            onClick={() => setShowHistory(!showHistory)}
            className={cn(showHistory && "text-primary")}
          >
            <History size={15} />
          </Btn>
          <Btn title="Chat leeren" onClick={() => confirm("Chatverlauf leeren?") && clearChat()}>
            <Eraser size={15} />
          </Btn>
        </div>
      </div>
      {settings.mode === "agent" && (
        <label className="flex items-start gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={settings.shareProject}
            onChange={(e) => setSettings({ shareProject: e.target.checked })}
            className="mt-0.5 accent-primary"
          />
          <span>
            Projektdateien und letzte Chatnachrichten an {PROVIDERS[settings.provider].name} senden.
            Projekte bleiben lokal; die Vorschau nutzt Sandpack-Dienste.
          </span>
        </label>
      )}
      <PhaseBar />
      {progress.length > 0 && (
        <details className="border-b px-3 py-2 text-xs" open={busy}>
          <summary className="cursor-pointer text-primary break-words">
            {progress[progress.length - 1]}
          </summary>
          <ol className="mt-2 space-y-1 text-muted-foreground">
            {progress.slice(0, -1).map((step, i) => (
              <li key={i}>
                {i + 1}. {step}
              </li>
            ))}
          </ol>
        </details>
      )}

      {showHistory && (
        <div className="max-h-56 overflow-auto border-b bg-panel p-2 text-xs">
          {project.history.length === 0 && (
            <p className="text-muted-foreground">Noch keine Snapshots.</p>
          )}
          {project.history.map((h) => (
            <div key={h.id} className="flex items-center gap-2 py-1">
              <span className="text-muted-foreground">{new Date(h.at).toLocaleTimeString()}</span>
              <span className="flex-1 truncate">{h.label}</span>
              <Btn
                className="h-6"
                disabled={busy}
                variant="outline"
                onClick={() => confirm("Diesen Stand wiederherstellen?") && restore(h.id)}
              >
                Wiederherstellen
              </Btn>
            </div>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
        {project.messages.length === 0 && (
          <div className="fade-up mx-auto max-w-xl space-y-5 py-4">
            <div className="text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl brand-gradient text-primary-foreground glow">
                <Sparkles size={22} />
              </div>
              <h2 className="text-xl font-extrabold">Was baust du heute?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Starte mit einer Vorlage oder beschreibe deine Idee.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => createProject(t.name, t.files)}
                  className="lift rounded-xl border bg-card p-3 text-left"
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="mt-1 block text-sm font-bold">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">{t.description}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => TEMPLATES.forEach((t) => createProject(`Demo: ${t.name}`, t.files))}
              className="lift w-full rounded-xl brand-gradient px-3 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Demo-Paket laden (alle 5 Vorzeige-Apps)
            </button>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Beispiel-Aufträge
              </p>
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="lift block w-full rounded-xl border border-dashed px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {project.messages.map((m, i) => (
          <Bubble
            key={m.id}
            m={m}
            {...(m.error && i === project.messages.length - 1 && lastUser && !busy
              ? {
                  onRetry: () =>
                    void runAgent(m.resume?.prompt ?? lastUser.content, [], undefined, m.resume),
                }
              : {})}
          />
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t p-2">
        {images.length > 0 && (
          <div className="mb-2 flex gap-2">
            {images.map((src, i) => (
              <div key={i} className="msg-in relative">
                <img
                  src={src}
                  alt={`Anhang ${i + 1}`}
                  className="size-14 rounded-lg border object-cover"
                />
                <button
                  aria-label="Bild entfernen"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
        {(imgNote || (images.length > 0 && visionModel && visionModel !== settings.model)) && (
          <p className="mb-1 px-1 text-[11px] text-muted-foreground">
            {imgNote || `Bilder gehen an das kostenlose Bildmodell ${visionModel}.`}
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={(e) => void pick(e.target.files)}
        />
        <div className="flex items-end gap-2 rounded-lg border bg-background p-1.5 focus-within:border-ring">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={
              settings.mode === "agent" ? "Baue mir eine Landingpage für…" : "Frag etwas…"
            }
            className="max-h-48 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1 outline-none"
          />
          <Btn
            className="h-10 w-10 shrink-0"
            title={
              imagesAllowed
                ? "Bild anhängen"
                : "Kein kostenloses Bildmodell verfügbar (nur OpenRouter)"
            }
            disabled={!imagesAllowed || busy}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus size={17} />
          </Btn>
          {busy ? (
            <Btn variant="danger" className="h-10 w-10" onClick={stopAgent} title="Stopp">
              <Square size={16} />
            </Btn>
          ) : (
            <Btn
              variant="primary"
              className="h-10 w-10 shrink-0"
              onClick={send}
              disabled={!input.trim() || (settings.mode === "agent" && !settings.shareProject)}
              title="Senden (⌘/Strg+Enter)"
            >
              <Send size={16} />
            </Btn>
          )}
        </div>
        <p className="mt-1 truncate px-1 font-mono text-[11px] text-muted-foreground">
          {settings.model}
        </p>
      </div>
    </div>
  );
}
