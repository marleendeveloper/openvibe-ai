import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CloudSun, LayoutDashboard, ListTodo, ShoppingBag, Sparkles, Globe, Moon, Sun, Palette } from "lucide-react";
import { APP_TYPES, APP_STYLES, starterDraft, type AppDraft } from "@/lib/studio/app-starters";
import { startApp } from "@/lib/studio/start-app";
import { TEMPLATES } from "@/lib/studio/templates";
import { useStudio } from "@/lib/studio/store";
import { Btn } from "./ui";
import { cn } from "@/lib/utils";

const icons = { shop: ShoppingBag, website: Globe, dashboard: LayoutDashboard, tasks: ListTodo, weather: CloudSun };
const styleIcons = { dark: Moon, light: Sun, colorful: Palette };

export function AppStarter({ onStarted, onClose }: { onStarted: () => void; onClose?: () => void }) {
  const [tab, setTab] = useState<"quick" | "custom">("quick");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AppDraft>(starterDraft("shop"));
  const [consent, setConsent] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");
  const provider = useStudio((s) => s.settings.provider);
  const launch = async (value: AppDraft) => {
    if (launching) return;
    setLaunching(true);
    setError("");
    try {
      await startApp(value, consent);
      onStarted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Start nicht möglich. Bitte erneut versuchen.");
    } finally {
      setLaunching(false);
    }
  };
  return (
    <section className="fade-up mx-auto max-w-xl space-y-4 py-2" aria-label="Neue App erstellen">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Was möchtest du erstellen?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Deine nächste App oder Website</p>
        </div>
        {onClose && <Btn onClick={onClose} title="Zurück zum Chat"><ArrowLeft size={18} /></Btn>}
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-lg border p-1" role="tablist" aria-label="Erstellungsart">
        <Btn role="tab" aria-selected={tab === "quick"} variant={tab === "quick" ? "primary" : "ghost"} disabled={launching} onClick={() => { setTab("quick"); setError(""); }}>Schnellstart</Btn>
        <Btn role="tab" aria-selected={tab === "custom"} variant={tab === "custom" ? "primary" : "ghost"} disabled={launching} onClick={() => { setTab("custom"); setError(""); }}>Eigene Idee</Btn>
      </div>
      {tab === "custom" && (
        <ol className="flex gap-3 text-xs text-muted-foreground" aria-label="Schritte">
          {["Typ", "Thema", "Stil"].map((label, i) => <li key={label} className={cn("flex items-center gap-1", step === i && "font-semibold text-primary")} aria-current={step === i ? "step" : undefined}>{i < step ? <Check size={12} /> : <span>{i + 1}.</span>}{label}</li>)}
        </ol>
      )}
      {(tab === "quick" || step === 0) && (
        <div className="grid grid-cols-2 gap-2">
          {APP_TYPES.map((type) => {
            const Icon = icons[type.id];
            const selected = tab === "custom" && draft.kind === type.id;
            return <Btn key={type.id} variant="outline" disabled={launching || (tab === "quick" && !consent)} aria-pressed={tab === "custom" ? selected : undefined} aria-label={tab === "quick" ? `${type.label} live erstellen` : type.label} onClick={() => tab === "quick" ? void launch(starterDraft(type.id)) : setDraft(starterDraft(type.id))} className={cn("lift h-auto min-h-28 flex-col items-start justify-between gap-3 whitespace-normal bg-card p-3 text-left", selected && "border-primary bg-primary/10")}>
              <Icon size={23} className="text-primary" />
              <span><span className="block font-bold">{type.label}</span><span className="mt-1 block text-xs text-muted-foreground">{type.subtitle}</span></span>
              {tab === "quick" && <span className="flex items-center gap-1 text-xs text-primary">Live erstellen <ArrowRight size={12} /></span>}
            </Btn>;
          })}
        </div>
      )}
      {tab === "custom" && step === 1 && (
        <div className="space-y-4">
          <label className="block space-y-1.5 text-sm font-medium">Name<input maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-11 w-full rounded-lg border bg-background px-3 outline-none focus:border-ring" /></label>
          <label className="block space-y-1.5 text-sm font-medium">Worum geht es?<textarea rows={3} maxLength={400} value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} className="w-full resize-y rounded-lg border bg-background p-3 outline-none focus:border-ring" /></label>
        </div>
      )}
      {tab === "custom" && step === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {APP_STYLES.map((style) => { const Icon = styleIcons[style.id]; return <Btn key={style.id} variant="outline" aria-pressed={draft.style === style.id} onClick={() => setDraft({ ...draft, style: style.id })} className={cn("h-20 flex-col gap-2", draft.style === style.id && "border-primary bg-primary/10 text-primary")}><Icon size={22} />{style.label}</Btn>; })}
          </div>
          <div className="border-y py-3 text-sm"><strong className="block break-words">{draft.name}</strong><p className="mt-1 break-words text-muted-foreground">{draft.topic}</p></div>
        </div>
      )}
      {(tab === "quick" || step === 2) && (
        <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <input type="checkbox" checked={consent} disabled={launching} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4 shrink-0 accent-primary" />
          Meine Angaben und die Dateien des neuen Projekts zur Erstellung an {provider === "openrouter" ? "OpenRouter" : provider === "huggingface" ? "Hugging Face" : "meinen KI-Anbieter"} senden.
        </label>
      )}
      {error && <p role="alert" className="break-words rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {tab === "custom" && (
        <div className="flex justify-between gap-2">
          <Btn variant="outline" disabled={step === 0 || launching} onClick={() => setStep(step - 1)}><ArrowLeft size={15} />Zurück</Btn>
          {step < 2 ? <Btn variant="primary" disabled={step === 1 && (!draft.name.trim() || !draft.topic.trim())} onClick={() => setStep(step + 1)}>Weiter<ArrowRight size={15} /></Btn> : <Btn variant="primary" disabled={!consent || launching} onClick={() => void launch(draft)}><Sparkles size={15} />{launching ? "Startet…" : "Jetzt erstellen"}</Btn>}
        </div>
      )}
      {launching && <p role="status" className="text-sm text-primary">KI-Erstellung wird gestartet…</p>}
      <details className="border-t pt-3 text-sm text-muted-foreground">
        <summary className="cursor-pointer">Fertige Beispiele öffnen</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => <Btn key={t.id} variant="outline" disabled={launching} onClick={() => { useStudio.getState().createProject(t.name, t.files); onStarted(); }}>{t.name}</Btn>)}
          <Btn variant="outline" disabled={launching} onClick={() => { TEMPLATES.forEach((t) => useStudio.getState().createProject(`Demo: ${t.name}`, t.files)); onStarted(); }}>Alle fünf öffnen</Btn>
        </div>
      </details>
    </section>
  );
}