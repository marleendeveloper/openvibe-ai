import { useStudio } from "./store";
import { useRuntime } from "./runtime";
import { loadProvider } from "./provider-client";
import { runAgent } from "./agent";
import { appPrompt, type AppDraft } from "./app-starters";

/** Explicit consent covers only the new project's files and the supplied idea. */
export async function startApp(draft: AppDraft, consent: boolean): Promise<void> {
  if (!consent) throw new Error("Bitte zuerst der Übertragung deiner Angaben zustimmen.");
  if (useRuntime.getState().busy) throw new Error("Bitte warte, bis der aktuelle Auftrag beendet ist.");
  const prompt = appPrompt(draft);
  const before = useStudio.getState();
  const { provider, model } = before.settings;
  if (!model) throw new Error("Bitte oben in den Einstellungen ein Modell auswählen.");
  const status = await loadProvider(provider);
  if (!status.configured) throw new Error("Bitte oben in den Einstellungen den KI-Anbieter verbinden.");
  const now = useStudio.getState();
  if (useRuntime.getState().busy || now.currentId !== before.currentId || now.settings.provider !== provider || now.settings.model !== model)
    throw new Error("Der aktive Auftrag oder die Auswahl hat sich geändert. Bitte erneut starten.");
  now.createProject(draft.name.trim());
  now.setSettings({ mode: "agent", autoApply: true, autoFix: true, shareProject: true });
  // runAgent pins its work synchronously before the first await.
  void runAgent(prompt);
}