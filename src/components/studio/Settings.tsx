import { useState } from "react";
import { X } from "lucide-react";
import { useStudio, DEFAULT_AGENT_PROMPT, DEFAULT_CHAT_PROMPT } from "@/lib/studio/store";
import { PROVIDERS, SUGGESTED_MODELS, type ProviderId } from "@/lib/studio/providers";
import { Btn } from "./ui";

export function Settings({ onClose }: { onClose: () => void }) {
  const { settings: s, setSettings } = useStudio();
  const [newModel, setNewModel] = useState("");
  const models = [...SUGGESTED_MODELS[s.provider], ...s.customModels];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-xl overflow-auto rounded-t-xl border bg-card p-5 md:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-semibold">Einstellungen</h2>
          <Btn className="ml-auto" onClick={onClose}><X size={18} /></Btn>
        </div>
        <div className="space-y-4 text-sm">
          <label className="block space-y-1">
            <span className="text-muted-foreground">Provider</span>
            <select className="field" value={s.provider} onChange={(e) => {
              const p = e.target.value as ProviderId;
              setSettings({ provider: p, model: SUGGESTED_MODELS[p][0] ?? s.model });
            }}>
              {(Object.keys(PROVIDERS) as ProviderId[]).map((p) => <option key={p} value={p}>{PROVIDERS[p].name}</option>)}
            </select>
          </label>
          {s.provider === "custom" && (
            <label className="block space-y-1">
              <span className="text-muted-foreground">Base-URL (OpenAI-kompatibel, CORS nötig)</span>
              <input className="field font-mono" placeholder="https://api.example.com/v1" value={s.customBaseUrl} onChange={(e) => setSettings({ customBaseUrl: e.target.value })} />
            </label>
          )}
          <label className="block space-y-1">
            <span className="text-muted-foreground">API-Key für {PROVIDERS[s.provider].name}</span>
            <input type="password" autoComplete="off" className="field font-mono" placeholder={PROVIDERS[s.provider].keyHint} value={s.keys[s.provider]} onChange={(e) => setSettings({ keys: { ...s.keys, [s.provider]: e.target.value } })} />
            <span className="block text-xs text-muted-foreground">Wird nur in diesem Browser gespeichert und direkt an den Anbieter weitergereicht.</span>
          </label>
          <label className="block space-y-1">
            <span className="text-muted-foreground">Modell</span>
            <input className="field font-mono" list="models" value={s.model} onChange={(e) => setSettings({ model: e.target.value })} />
            <datalist id="models">{models.map((m) => <option key={m} value={m} />)}</datalist>
            <div className="flex flex-wrap gap-1 pt-1">
              {models.map((m) => (
                <button key={m} onClick={() => setSettings({ model: m })} className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${m === s.model ? "border-primary text-primary" : "text-muted-foreground"}`}>{m.split("/").pop()}</button>
              ))}
            </div>
          </label>
          <div className="flex gap-2">
            <input className="field font-mono" placeholder="Eigenes Modell merken: org/model" value={newModel} onChange={(e) => setNewModel(e.target.value)} />
            <Btn variant="outline" className="h-auto" onClick={() => { if (newModel.trim()) { setSettings({ customModels: [...new Set([...s.customModels, newModel.trim()])], model: newModel.trim() }); setNewModel(""); } }}>Merken</Btn>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-muted-foreground">Temperatur {s.temperature}</span>
              <input type="range" min={0} max={1.5} step={0.05} value={s.temperature} onChange={(e) => setSettings({ temperature: +e.target.value })} className="w-full accent-primary" />
            </label>
            <label className="block space-y-1">
              <span className="text-muted-foreground">Max Tokens</span>
              <input type="number" className="field" value={s.maxTokens} onChange={(e) => setSettings({ maxTokens: +e.target.value || 4096 })} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-muted-foreground">Zusatz-Systemprompt für <span className="font-mono">{s.model.split("/").pop()}</span></span>
            <textarea rows={3} className="field font-mono text-xs" value={s.modelPrompts[s.model] ?? ""} onChange={(e) => setSettings({ modelPrompts: { ...s.modelPrompts, [s.model]: e.target.value } })} />
          </label>
          <label className="block space-y-1">
            <span className="flex text-muted-foreground">Agent-Systemprompt <button className="ml-auto text-xs underline" onClick={() => setSettings({ agentPrompt: DEFAULT_AGENT_PROMPT })}>Zurücksetzen</button></span>
            <textarea rows={6} className="field font-mono text-xs" value={s.agentPrompt} onChange={(e) => setSettings({ agentPrompt: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="flex text-muted-foreground">Chat-Systemprompt <button className="ml-auto text-xs underline" onClick={() => setSettings({ chatPrompt: DEFAULT_CHAT_PROMPT })}>Zurücksetzen</button></span>
            <textarea rows={3} className="field font-mono text-xs" value={s.chatPrompt} onChange={(e) => setSettings({ chatPrompt: e.target.value })} />
          </label>
        </div>
      </div>
    </div>
  );
}
