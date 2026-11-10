import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { UserRound, X, LogOut, Save, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAccount } from "@/lib/studio/auth-state";
import { loadProfile, saveProfile } from "@/lib/studio/profile.functions";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Btn } from "./ui";

export function Account({ onClose }: { onClose: () => void }) {
  const { user, loading, signOut } = useAccount();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const readProfile = useServerFn(loadProfile);
  const writeProfile = useServerFn(saveProfile);
  useEffect(() => {
    let active = true;
    setNotice(""); setError(""); setPassword("");
    if (user) void readProfile().then((profile) => { if (active) { setName(profile.display_name); setBio(profile.bio); } }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Profil konnte nicht geladen werden."); });
    return () => { active = false; };
  }, [user?.id]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (user) { const p = await writeProfile({ data: { display_name: name, bio } }); setName(p.display_name); setBio(p.bio); setNotice("Profil gespeichert."); }
      else if (mode === "register") {
        const result = await supabase.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: window.location.origin } });
        if (result.error) throw result.error;
        setPassword(""); setNotice(result.data.session ? "Registriert und angemeldet." : "Bitte bestätige deine E-Mail-Adresse über den zugesandten Link. Danach kannst du dich anmelden.");
      } else if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setNotice("Falls ein Konto zu dieser E-Mail existiert, erhältst du einen Link zum Zurücksetzen.");
      } else { const result = await supabase.auth.signInWithPassword({ email, password }); if (result.error) throw result.error; setPassword(""); }
    } catch (e) { setError(e instanceof Error ? e.message : "Vorgang fehlgeschlagen."); }
    finally { setBusy(false); }
  }
  async function social(provider: "google" | "lovable") {
    setError(""); setBusy(true);
    try { const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin }); if (r.error) throw r.error; }
    catch (e) { setError(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen."); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/70 backdrop-blur-sm md:items-center">
    <section role="dialog" aria-modal="true" aria-label={user ? "Mein Profil" : "Anmeldung"} className="max-h-[92dvh] w-full max-w-md overflow-auto rounded-t-lg border bg-card p-5 md:rounded-lg">
      <header className="mb-5 flex items-center gap-2"><UserRound size={19} className="text-primary" /><h2 className="font-semibold">{user ? "Mein Profil" : "OpenVibe Konto"}</h2><Btn title="Konto schließen" className="ml-auto" onClick={onClose}><X size={18} /></Btn></header>
      {loading ? <LoaderCircle className="animate-spin" /> : <>
        {!user && <div className="mb-4 flex gap-2"><Btn variant={mode === "login" ? "primary" : "outline"} onClick={() => { setMode("login"); setNotice(""); setError(""); }}>Login</Btn><Btn variant={mode === "register" ? "primary" : "outline"} onClick={() => { setMode("register"); setNotice(""); setError(""); }}>Registrierung</Btn></div>}
        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          {(user || mode === "register") && <label className="block space-y-1 text-sm">Anzeigename<input className="field" value={name} maxLength={80} autoComplete="nickname" onChange={(e) => setName(e.target.value)} /></label>}
          {user ? <><p className="break-all text-sm text-muted-foreground">{user.email}</p><label className="block space-y-1 text-sm">Über mich<textarea className="field" rows={3} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} /></label></> : <>
            <label className="block space-y-1 text-sm">E-Mail<input type="email" className="field" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            {mode !== "forgot" && <label className="block space-y-1 text-sm">Passwort<input type="password" className="field" required minLength={8} autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
          </>}
          <Btn type="submit" variant="primary" disabled={busy} className="w-full">{busy ? <LoaderCircle size={16} className="animate-spin" /> : user ? <Save size={16} /> : <UserRound size={16} />}{user ? "Profil speichern" : mode === "register" ? "Konto erstellen" : mode === "forgot" ? "Reset-Link senden" : "Anmelden"}</Btn>
        </form>
        {!user && <div className="mt-4 space-y-3"><Btn onClick={() => { setMode("forgot"); setNotice(""); setError(""); }}>Passwort vergessen?</Btn><div className="flex flex-col gap-2"><Btn disabled={busy} className="lovable-auth-button" onClick={() => void social("lovable")}>Continue with Lovable</Btn><Btn disabled={busy} className="google-auth-button" onClick={() => void social("google")}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Mit Google fortfahren</Btn></div></div>}
        {user && <Btn className="mt-4 w-full" disabled={busy} onClick={() => { setBusy(true); void signOut().then(onClose).catch((e: unknown) => setError(e instanceof Error ? e.message : "Abmeldung fehlgeschlagen.")).finally(() => setBusy(false)); }}><LogOut size={16} />Abmelden</Btn>}
      </>}
      {notice && <p role="status" className="mt-4 break-words text-sm text-primary">{notice}</p>}
      {error && <p role="alert" className="mt-4 break-words text-sm text-destructive">{error}</p>}
    </section>
  </div>;
}