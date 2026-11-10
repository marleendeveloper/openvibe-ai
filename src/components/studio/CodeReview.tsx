import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, X, Download, LoaderCircle } from "lucide-react";
import { useProject, useStudio } from "@/lib/studio/store";
import { filesRevision } from "@/lib/studio/preview-state";
import { reviewCode } from "@/lib/studio/review.functions";
import type { ReviewResult } from "@/lib/studio/review";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Btn } from "./ui";

export function CodeReview({ onClose }: { onClose: () => void }) {
  const project = useProject();
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const callReview = useServerFn(reviewCode);
  useEffect(() => { void supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);
  useEffect(() => { setSelected([]); setConsent(false); setResult(null); setError(""); }, [project.id]);
  const paths = mode === "all" ? Object.keys(project.files) : selected.filter((path) => project.files[path] !== undefined);
  const stale = result && result.revision !== filesRevision(project.files);

  async function signIn(provider: "google" | "lovable") {
    setError("");
    try {
      const response = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (response.error) throw response.error;
      if (!response.redirected) setSignedIn(!!(await supabase.auth.getSession()).data.session);
    } catch (e) { setError(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen."); }
  }
  async function run() {
    if (busy || !consent || !paths.length) return;
    setBusy(true); setError(""); setResult(null);
    const projectId = project.id;
    const revision = filesRevision(project.files);
    const files = Object.fromEntries(paths.map((path) => [path, project.files[path] ?? ""]));
    try {
      const response = await callReview({ data: { projectId, revision, files, consent: true } });
      if (useStudio.getState().currentId !== projectId) return;
      if (response.projectId !== projectId || response.revision !== revision) throw new Error("Prüfergebnis gehört nicht zum gesendeten Projektstand.");
      setResult(response);
    } catch (e) { if (useStudio.getState().currentId === projectId) setError(e instanceof Error ? e.message : "Codeprüfung fehlgeschlagen."); }
    finally { setBusy(false); }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "openvibe-code-review.json"; link.click(); URL.revokeObjectURL(url);
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm md:items-center">
    <section role="dialog" aria-modal="true" aria-label="Codeprüfung" className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-lg border bg-card md:rounded-lg">
      <header className="flex shrink-0 items-center gap-2 border-b p-4"><ShieldCheck size={19} className="text-primary" /><h2 className="font-semibold">Codeprüfung</h2><Btn title="Codeprüfung schließen" className="ml-auto" onClick={onClose}><X size={18} /></Btn></header>
      <div className="space-y-4 overflow-auto p-4 text-sm">
        <p className="break-words font-mono">{project.name}</p>
        <div className="flex gap-2"><Btn variant={mode === "all" ? "primary" : "outline"} onClick={() => { setMode("all"); setConsent(false); }}>Ganzes Projekt</Btn><Btn variant={mode === "selected" ? "primary" : "outline"} onClick={() => { setMode("selected"); setConsent(false); }}>Dateien auswählen</Btn></div>
        {mode === "selected" && <fieldset className="max-h-48 space-y-2 overflow-auto border p-3"><legend>Dateien</legend>{Object.keys(project.files).map((path) => <label key={path} className="flex items-center gap-2 break-all font-mono text-xs"><input type="checkbox" checked={selected.includes(path)} onChange={(e) => { setSelected((old) => e.target.checked ? [...old, path] : old.filter((p) => p !== path)); setConsent(false); }} />{path}</label>)}</fieldset>}
        <p className="text-xs text-muted-foreground">{paths.length} Dateien · GPT-6 Astra · AI Gateway · verbraucht AI-Credits, nicht vom 0€-Schutz abgedeckt</p>
        <label className="flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />Ich stimme der Übertragung der gewählten Dateien an AI Gateway zur Codeprüfung zu.</label>
        {!signedIn ? <div className="flex flex-wrap gap-2"><Btn className="lovable-auth-button" onClick={() => void signIn("lovable")}>Continue with Lovable</Btn><Btn variant="outline" className="google-auth-button" onClick={() => void signIn("google")}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Mit Google fortfahren</Btn></div> : <Btn variant="primary" disabled={busy || !consent || !paths.length} onClick={() => void run()}>{busy ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" /> : <ShieldCheck size={16} />}{busy ? "Prüfung läuft…" : "Code prüfen"}</Btn>}
        {error && <p role="alert" className="break-words text-destructive">{error}</p>}
        {result && <div className="space-y-4">
          <div className="flex items-center gap-2"><h3 className="font-semibold">Prüfergebnis · {result.report.findings.length} Befunde</h3><Btn title="Prüfergebnis herunterladen" className="ml-auto" onClick={download}><Download size={16} /></Btn></div>
          {stale && <p role="status" className="text-destructive">Veralteter Stand: Projektdateien wurden seit dieser Prüfung geändert.</p>}
          <p className="whitespace-pre-wrap break-words">{result.report.summary}</p>
          {!result.report.findings.length && <p className="text-muted-foreground">Keine konkreten Befunde im bereitgestellten Code. Dies ist keine Sicherheitsgarantie.</p>}
          {result.report.findings.map((finding, index) => <article key={index} className="space-y-2 border-t pt-4"><p className="font-mono text-xs text-primary">{finding.priority} · {finding.category === "security" ? "Sicherheitsrisiko" : "Fehler"} · {finding.file}:{finding.line}</p><h4 className="break-words font-semibold">{finding.title}</h4><pre className="overflow-auto whitespace-pre-wrap break-words font-mono text-xs">{finding.evidence}</pre><p className="break-words">{finding.impact}</p><details><summary className="cursor-pointer text-primary">Korrekturvorschlag</summary><pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs">{finding.fix}</pre></details></article>)}
        </div>}
      </div>
    </section>
  </div>;
}