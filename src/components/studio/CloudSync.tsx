import { useCallback, useEffect, useState } from "react";
import { CloudUpload, CloudDownload, RefreshCw, Trash2 } from "lucide-react";
import { useProject } from "@/lib/studio/store";
import { useAccount } from "@/lib/studio/auth-state";
import { listProjects, pullProject, pushProject, removeCloudProject } from "@/lib/studio/cloud-sync";
import { Btn } from "./ui";

type CloudEntry = { id: string; name: string; updated_at: string };

export function CloudSync() {
  const { user } = useAccount();
  const project = useProject();
  const [entries, setEntries] = useState<CloudEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    try { setEntries(await listProjects()); } catch (e) { setStatus((e as Error).message); }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (!user) return null;

  const run = async (fn: () => Promise<string | void>, done: string) => {
    setBusy(true);
    setStatus("");
    try {
      await fn();
      setStatus(done);
      await refresh();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t p-3 space-y-2">
      <div className="flex items-center gap-1">
        <span className="flex-1 text-xs uppercase tracking-widest text-muted-foreground">Konto</span>
        <Btn title="Liste aktualisieren" disabled={busy} onClick={() => void refresh()}><RefreshCw size={13} /></Btn>
      </div>
      <Btn variant="outline" className="w-full" disabled={busy} onClick={() => void run(async () => { await pushProject(project); }, "Im Konto gespeichert.")}>
        <CloudUpload size={14} /> {project.cloudId ? "Aktualisieren" : "Im Konto speichern"}
      </Btn>
      {entries.length > 0 && (
        <ul className="space-y-1 text-xs">
          {entries.map((e) => (
            <li key={e.id} className="group flex items-center gap-1">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{e.name}{e.id === project.cloudId ? " · aktuell" : ""}</span>
              <Btn className="h-7 px-1.5" title="Laden (ersetzt lokale Kopie)" disabled={busy}
                onClick={() => void run(async () => { await pullProject(e.id); }, "Geladen.")}><CloudDownload size={13} /></Btn>
              <Btn className="h-7 px-1.5 hover:text-destructive md:opacity-0 group-hover:opacity-100" title="Aus Konto löschen" disabled={busy}
                onClick={() => { if (confirm(`"${e.name}" aus dem Konto löschen?`)) void run(async () => { await removeCloudProject(e.id); }, "Gelöscht."); }}><Trash2 size={13} /></Btn>
            </li>
          ))}
        </ul>
      )}
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
