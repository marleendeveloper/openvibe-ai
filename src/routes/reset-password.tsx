import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Btn } from "@/components/studio/ui";
import { useAccount } from "@/lib/studio/auth-state";
export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Passwort zurücksetzen – OpenVibe" }, { name: "description", content: "Ein neues Passwort für dein OpenVibe-Konto festlegen." }, { property: "og:title", content: "OpenVibe Passwort zurücksetzen" }, { property: "og:description", content: "Sicherer Passwortwechsel über deinen Wiederherstellungslink." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ResetPassword,
});
function ResetPassword() {
  const { recovery: recoverySession } = useAccount();
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { const params = new URLSearchParams(window.location.hash.slice(1)); setRecovery(recoverySession || params.get("type") === "recovery"); }, [recoverySession]);
  return <main className="flex min-h-dvh items-center justify-center p-5"><div className="w-full max-w-md space-y-5"><h1 className="text-xl font-semibold">OpenVibe · Neues Passwort</h1>{!recovery ? <p>Öffne diese Seite über den Link aus deiner Passwort-Reset-E-Mail.</p> : <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (password !== confirm) { setNotice("Die Passwörter stimmen nicht überein."); return; } setBusy(true); void supabase.auth.updateUser({ password }).then(({ error }) => { setNotice(error ? error.message : "Passwort geändert."); if (!error) { setRecovery(false); setPassword(""); setConfirm(""); } }).finally(() => setBusy(false)); }}><label className="block">Neues Passwort<input required minLength={8} type="password" autoComplete="new-password" className="field mt-1" value={password} onChange={(e) => setPassword(e.target.value)} /></label><label className="block">Passwort bestätigen<input required minLength={8} type="password" autoComplete="new-password" className="field mt-1" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label><Btn variant="primary" type="submit" disabled={busy}>Passwort speichern</Btn></form>}{notice && <p role="status">{notice}</p>}<Link to="/" className="text-primary underline">Zurück zum Studio</Link></div></main>;
}