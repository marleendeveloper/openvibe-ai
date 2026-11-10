import { useEffect, useState } from "react";
import { X, FolderOpen, Globe, MessageSquare, RefreshCw, CloudDownload, ExternalLink, ChevronDown, HardDrive } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { projectOverview } from "@/lib/studio/cloud.functions";
import { pullProject } from "@/lib/studio/cloud-sync";
import { useAccount } from "@/lib/studio/auth-state";
import { useStudio } from "@/lib/studio/store";
import { Btn } from "./ui";
import { cn } from "@/lib/utils";

type Entry = Awaited<ReturnType<typeof projectOverview>>[number];
type Filter = "all" | "published" | "chat";

const fmt = (d: string) => new Date(d).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });

export function Overview({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  const { user } = useAccount();
  const load = useServerFn(projectOverview);
  const localProjects = useStudio((s) => s.projects);
  const currentId = useStudio((s) => s.currentId);
  const selectProject = useStudio((s) => s.selectProject);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setError("");
    try { setEntries(await load()); } catch (e) { setError((e as Error).message); }
  };
  useEffect(() => { if (user) void refresh(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = (entries ?? []).filter((e) => filter === "all" || (filter === "published" ? e.publication : e.messages.length > 0));
  const stats = [
    { label: "Gespeichert", value: entries?.length ?? 0, icon: FolderOpen },
    { label: "Veröffentlicht", value: entries?.filter((e) => e.publication).length ?? 0, icon: Globe },
    { label: "Nachrichten", value: entries?.reduce((n, e) => n + e.messages.length, 0) ?? 0, icon: MessageSquare },
  ];
  const openProject = async (cloudId: string) => {
    setBusy(true);
    try {
      const local = localProjects.find((p) => p.cloudId === cloudId);
      if (local) selectProject(local.id); else await pullProject(cloudId);
      onClose();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="tab-in *:dialog-in fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div role="dialog" aria-label="Projekt-Übersicht" className="flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl border bg-panel md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <h2 className="flex-1 text-base font-extrabold uppercase tracking-[0.15em]">Projekte</h2>
          {user && <Btn title="Aktualisieren" onClick={() => void refresh()}><RefreshCw size={15} /></Btn>}
          <Btn title="Schließen" onClick={onClose}><X size={17} /></Btn>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
          {!user ? (
            <div className="space-y-3 rounded-xl border bg-card p-4 text-sm">
              <p className="text-muted-foreground">Melde dich an, um gespeicherte Projekte, veröffentlichte Apps und Chat-Verläufe zu sehen.</p>
              <Btn variant="primary" onClick={onSignIn}>Anmelden</Btn>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl border bg-card p-3">
                    <s.icon size={15} className="text-primary" />
                    <div className="mt-1 text-2xl font-extrabold">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 rounded-full border bg-background p-1 text-xs">
                {([["all", "Alle"], ["published", "Veröffentlicht"], ["chat", "Mit Verlauf"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setFilter(id)} className={cn("flex-1 rounded-full px-3 py-1.5 font-semibold transition", filter === id ? "brand-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{label}</button>
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {entries === null && !error && <p className="text-sm text-muted-foreground">Lade Übersicht…</p>}
              {entries && list.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Noch nichts hier. Speichere ein Projekt im Dateien-Tab unter „Konto“.</p>}
              <ul className="space-y-2">
                {list.map((e) => {
                  const active = localProjects.find((p) => p.id === currentId)?.cloudId === e.id;
                  const expanded = open === e.id;
                  return (
                    <li key={e.id} className={cn("rounded-xl border bg-card", active && "border-primary/60")}>
                      <div className="flex items-start gap-3 p-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><FolderOpen size={17} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate font-semibold">{e.name}</span>
                            {active && <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">Geöffnet</span>}
                            {e.publication && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">Live</span>}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{e.fileCount} Dateien · {e.messages.length} Nachrichten · {fmt(e.updatedAt)}</div>
                          {e.publication && (
                            <a href={`/p/${e.publication.slug}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-success hover:underline">
                              /p/{e.publication.slug} <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                        <Btn variant="outline" disabled={busy} onClick={() => void openProject(e.id)}><CloudDownload size={14} /> Öffnen</Btn>
                      </div>
                      {e.messages.length > 0 && (
                        <>
                          <button onClick={() => setOpen(expanded ? null : e.id)} className="flex w-full items-center gap-1.5 border-t px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
                            <MessageSquare size={13} /> Chat-Verlauf <ChevronDown size={13} className={cn("ml-auto transition", expanded && "rotate-180")} />
                          </button>
                          {expanded && (
                            <ol className="max-h-72 space-y-2 overflow-auto border-t p-3">
                              {e.messages.map((m, i) => (
                                <li key={i} className={cn("rounded-lg px-3 py-2 text-xs", m.role === "user" ? "ml-6 bg-primary/15" : "mr-6 bg-muted")}>
                                  <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{m.role === "user" ? "Du" : "KI"} · {fmt(m.createdAt)}</div>
                                  <p className="line-clamp-4 whitespace-pre-wrap break-words">{m.content || "(Dateiänderungen)"}</p>
                                </li>
                              ))}
                            </ol>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <div className="rounded-xl border bg-card p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground"><HardDrive size={13} /> Auf diesem Gerät</div>
            {localProjects.length} lokale Projekte, davon {localProjects.filter((p) => p.cloudId).length} mit dem Konto verknüpft.
          </div>
        </div>
      </div>
    </div>
  );
}
