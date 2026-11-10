import { useCallback, useEffect, useState } from "react";
import { Globe, X } from "lucide-react";
import { useProject } from "@/lib/studio/store";
import { useAccount } from "@/lib/studio/auth-state";
import { pushProject } from "@/lib/studio/cloud-sync";
import { getPublication, publishApp, unpublishApp } from "@/lib/studio/cloud.functions";
import { Btn } from "./ui";

export function Publish({ onClose }: { onClose: () => void }) {
  const { user } = useAccount();
  const project = useProject();
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState<{ slug: string; title: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const refresh = useCallback(async () => {
    if (!project.cloudId) return;
    try {
      const pub = await getPublication({ data: { cloudId: project.cloudId } });
      if (pub) { setPublished(pub); setSlug(pub.slug); }
    } catch { /* keine bestehende Veröffentlichung */ }
  }, [project.cloudId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const publish = async () => {
    setBusy(true);
    setStatus("");
    try {
      const cloudId = await pushProject(project);
      const result = await publishApp({ data: { cloudId, slug, title: project.name } });
      setPublished({ slug: result.slug, title: project.name });
      setStatus("Veröffentlicht.");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!project.cloudId) return;
    setBusy(true);
    setStatus("");
    try {
      await unpublishApp({ data: { cloudId: project.cloudId } });
      setPublished(null);
      setStatus("Veröffentlichung zurückgenommen.");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const url = published ? `${window.location.origin}/p/${published.slug}` : null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4" role="dialog" aria-label="App veröffentlichen">
      <div className="w-full max-w-md rounded-lg border bg-panel p-4 space-y-3 shadow-xl">
        <div className="flex items-center gap-2">
          <Globe size={17} className="text-primary" />
          <h2 className="flex-1 text-sm font-semibold">App veröffentlichen</h2>
          <Btn onClick={onClose}><X size={16} /></Btn>
        </div>
        {!user ? (
          <p className="text-sm text-muted-foreground">Bitte zuerst über das Profil-Symbol anmelden, um eine App zu veröffentlichen.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Die App erhält einen öffentlichen Link. Jeder mit dem Link kann sie ansehen. Der aktuelle Stand wird dafür im Konto gespeichert.</p>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Link-Name</span>
              <input className="field w-full" placeholder="meine-app" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} disabled={busy || !!published} />
            </label>
            {url && (
              <p className="break-all rounded border bg-background p-2 font-mono text-xs">
                <a className="text-primary underline" href={url} target="_blank" rel="noreferrer">{url}</a>
              </p>
            )}
            <div className="flex gap-2">
              {published ? (
                <>
                  <Btn variant="outline" className="flex-1" disabled={busy} onClick={() => void publish()}>Aktualisieren</Btn>
                  <Btn variant="danger" className="flex-1" disabled={busy} onClick={() => void unpublish()}>Zurücknehmen</Btn>
                </>
              ) : (
                <Btn variant="primary" className="flex-1" disabled={busy || slug.length < 3} onClick={() => void publish()}>Veröffentlichen</Btn>
              )}
            </div>
          </>
        )}
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>
    </div>
  );
}
