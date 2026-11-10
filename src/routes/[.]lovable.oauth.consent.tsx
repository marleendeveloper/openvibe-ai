import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle, PlugZap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/studio/auth-state";
import { isOwnerEmail } from "@/lib/studio/owner";
import { OwnerGate } from "@/components/studio/Passkeys";
import { Btn } from "@/components/studio/ui";

type Details = { client?: { name?: string; redirect_uri?: string }; scope?: string; redirect_url?: string; redirect_to?: string };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: Details | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: Details | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: Details | null; error: { message: string } | null }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "" }),
  head: () => ({ meta: [{ title: "Verbindung erlauben – OpenVibe" }, { name: "description", content: "Einen KI-Assistenten mit dem OpenVibe-Studio verbinden." }, { property: "og:title", content: "Verbindung erlauben – OpenVibe" }, { property: "og:description", content: "Einen KI-Assistenten mit dem OpenVibe-Studio verbinden." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ConsentPage,
  errorComponent: ({ error }) => <main className="grid h-dvh place-items-center p-6 text-sm">Anfrage konnte nicht geladen werden: {error instanceof Error ? error.message : String(error)}</main>,
});

function ConsentPage() {
  const { user, loading } = useAccount();
  if (loading) return <div className="grid h-dvh place-items-center"><LoaderCircle className="animate-spin" /></div>;
  if (!user || !isOwnerEmail(user.email)) return <OwnerGate />;
  return <Consent email={user.email!} />;
}

function Consent({ email }: { email: string }) {
  const { authorization_id } = Route.useSearch();
  const [details, setDetails] = useState<Details | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authorization_id) { setError("Ungültige oder abgelaufene Anfrage."); return; }
    oauth().getAuthorizationDetails(authorization_id).then(({ data, error }) => {
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    }, (e) => setError(String(e)));
  }, [authorization_id]);

  async function decide(approve: boolean) {
    setBusy(true); setError("");
    try {
      const { data, error } = approve ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
      if (error) throw new Error(error.message);
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) throw new Error("Keine Weiterleitung erhalten.");
      window.location.href = target;
    } catch (e) { setError(e instanceof Error ? e.message : "Fehlgeschlagen."); setBusy(false); }
  }

  const name = details?.client?.name ?? "Ein Assistent";
  return (
    <main className="grid h-dvh place-items-center p-6">
      <div className="fade-up w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6">
        <div className="grid size-12 place-items-center rounded-xl brand-gradient text-primary-foreground"><PlugZap size={22} /></div>
        {!details && !error ? <LoaderCircle className="animate-spin" /> : details && <>
          <h1 className="text-lg font-bold">{name} mit OpenVibe verbinden</h1>
          <p className="text-sm text-muted-foreground">{name} kann deine gespeicherten Projekte und veröffentlichten Apps lesen, als {email}.</p>
          {details.client?.redirect_uri && <p className="break-all text-xs text-muted-foreground">Weiterleitung: {details.client.redirect_uri}</p>}
          <p className="text-xs text-muted-foreground">Deine Berechtigungen im Studio werden dadurch nicht umgangen.</p>
          <div className="flex gap-2">
            <Btn variant="outline" className="flex-1" disabled={busy} onClick={() => void decide(false)}>Abbrechen</Btn>
            <Btn variant="primary" className="flex-1" disabled={busy} onClick={() => void decide(true)}>Erlauben</Btn>
          </div>
        </>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </main>
  );
}
