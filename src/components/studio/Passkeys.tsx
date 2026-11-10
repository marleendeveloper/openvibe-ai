import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, LoaderCircle, Mail, Trash2, ExternalLink, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { passkeyLoginOptions, passkeyLoginVerify, passkeyRegisterOptions, passkeyRegisterVerify, listPasskeys, deletePasskey } from "@/lib/studio/passkey.functions";
import { isOwnerEmail } from "@/lib/studio/owner";
import { useAccount } from "@/lib/studio/auth-state";
import { Btn } from "./ui";

const inFrame = () => { try { return window.self !== window.top; } catch { return true; } };
const msg = (e: unknown) => (e instanceof Error && e.name === "NotAllowedError" ? "Passkey abgebrochen." : e instanceof Error ? e.message : "Vorgang fehlgeschlagen.");

/** Full-screen gate: only the owner gets past it. */
export function OwnerGate() {
  const { user, signOut } = useAccount();
  const loginOptions = useServerFn(passkeyLoginOptions);
  const loginVerify = useServerFn(passkeyLoginVerify);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showMail, setShowMail] = useState(false);
  const framed = inFrame();

  async function passkey() {
    setBusy(true); setError("");
    try {
      const options = await loginOptions();
      const response = await startAuthentication({ optionsJSON: options });
      const { tokenHash } = await loginVerify({ data: { response } });
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
      if (error) throw error;
    } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }
  async function mail(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (isOwnerEmail(email)) {
        const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } });
        if (error) throw error;
      }
      setNotice("Falls diese E-Mail Zugriff hat, kommt gleich ein Anmeldelink.");
    } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }

  return (
    <div className="grid h-dvh place-items-center p-6">
      <div className="fade-up w-full max-w-sm space-y-5 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl brand-gradient text-primary-foreground glow"><Fingerprint size={30} /></div>
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-[0.2em]">OpenVibe</h1>
          <p className="mt-1 text-sm text-muted-foreground">Privates Studio. Nur für die Besitzerin.</p>
        </div>
        {user && !isOwnerEmail(user.email) ? (
          <div className="space-y-3 rounded-xl border bg-card p-4 text-sm">
            <p>Dieses Konto hat keinen Zugriff.</p>
            <Btn variant="outline" className="w-full" onClick={() => void signOut()}><LogOut size={15} /> Abmelden</Btn>
          </div>
        ) : (
          <>
            {framed && <a href={window.location.href} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 p-2.5 text-xs text-primary"><ExternalLink size={13} /> Passkeys funktionieren nur im eigenen Tab – hier öffnen</a>}
            <Btn variant="primary" className="h-12 w-full text-base" disabled={busy} onClick={() => void passkey()}>
              {busy ? <LoaderCircle className="animate-spin" size={18} /> : <Fingerprint size={18} />} Mit Passkey anmelden
            </Btn>
            {!showMail ? (
              <button className="text-xs text-muted-foreground underline-offset-4 hover:underline" onClick={() => setShowMail(true)}>Notfall: Anmeldelink per E-Mail</button>
            ) : (
              <form onSubmit={mail} className="space-y-2 text-left">
                <input className="field" type="email" required autoComplete="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Btn variant="outline" type="submit" className="w-full" disabled={busy}><Mail size={15} /> Link senden</Btn>
              </form>
            )}
          </>
        )}
        {notice && <p className="text-xs text-success">{notice}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

/** Owner profile section: add / remove passkeys for this domain. */
export function PasskeyManager() {
  const list = useServerFn(listPasskeys);
  const remove = useServerFn(deletePasskey);
  const regOptions = useServerFn(passkeyRegisterOptions);
  const regVerify = useServerFn(passkeyRegisterVerify);
  const [items, setItems] = useState<{ id: string; label: string; rp_id: string; created_at: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const refresh = () => list().then(setItems).catch((e: unknown) => setNote(msg(e)));
  useEffect(() => { void refresh(); }, []);
  async function add() {
    setBusy(true); setNote("");
    try {
      const options = await regOptions();
      const response = await startRegistration({ optionsJSON: options });
      await regVerify({ data: { response, label: /iPhone|iPad/.test(navigator.userAgent) ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "Gerät" } });
      setNote("Passkey gespeichert."); await refresh();
    } catch (e) { setNote(msg(e)); } finally { setBusy(false); }
  }
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return (
    <div className="space-y-2 rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-sm font-bold"><Fingerprint size={15} /> Passkeys</span>
        <Btn variant="primary" className="h-8" disabled={busy || inFrame()} onClick={() => void add()}>{busy ? <LoaderCircle size={14} className="animate-spin" /> : null}Passkey hinzufügen</Btn></div>
      {inFrame() && <p className="text-xs text-muted-foreground">Zum Hinzufügen die App in einem eigenen Tab öffnen.</p>}
      {items.length === 0 && <p className="text-xs text-muted-foreground">Noch kein Passkey.</p>}
      {items.map((p) => (
        <div key={p.id} className="flex items-center gap-2 text-xs">
          <span className="flex-1 truncate">{p.label} · {p.rp_id === host ? "diese Adresse" : p.rp_id} · {new Date(p.created_at).toLocaleDateString()}</span>
          <Btn className="h-7" title="Passkey löschen" onClick={() => confirm("Passkey löschen?") && void remove({ data: { id: p.id } }).then(refresh)}><Trash2 size={13} /></Btn>
        </div>
      ))}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
