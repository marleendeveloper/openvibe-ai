import { useEffect, useState } from "react";
import { X, RefreshCw, KeyRound, PlugZap, Trash2 } from "lucide-react";
import { useStudio, DEFAULT_AGENT_PROMPT, DEFAULT_CHAT_PROMPT } from "@/lib/studio/store";
import { PROVIDERS, type ProviderId, type ProviderStatus } from "@/lib/studio/providers";
import { configureProvider, loadProvider } from "@/lib/studio/provider-client";
import { useRuntime } from "@/lib/studio/runtime";
import { Btn } from "./ui";
import { useServerFn } from "@tanstack/react-start";
import { useSavedOpenRouter } from "@/lib/studio/saved-provider.functions";
import { supabase } from "@/integrations/supabase/client";

export function Settings({ onClose }: { onClose: () => void }) {
  const { settings: s, setSettings } = useStudio();
  const [newModel, setNewModel] = useState("");
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState(false);
  const [freeOnly, setFreeOnly] = useState(true);
  const connectSaved = useServerFn(useSavedOpenRouter);
  const savedKey = async () => {
    setWorking(true);
    setNotice("");
    try {
      if (!(await supabase.auth.getSession()).data.session)
        throw new Error(
          "Bitte zuerst über die Codeprüfung mit Lovable oder Google anmelden, um den gespeicherten Projektschlüssel zu verwenden.",
        );
      await connectSaved();
      const result = await loadProvider("openrouter");
      setStatus(result);
      useRuntime.getState().setConnected("openrouter", result.configured);
      setNotice("Gespeicherter Schlüssel verbunden. Verbindungstest bereit.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Verbindung fehlgeschlagen.");
    } finally {
      setWorking(false);
    }
  };
  const models = (status?.models ?? []).filter(
    (m) => s.provider !== "openrouter" || !freeOnly || m.free,
  );
  const modelIds = [...new Set([...models.map((m) => m.id), ...s.customModels])];
  const refresh = async () => {
    setWorking(true);
    setNotice("");
    try {
      const result = await loadProvider(s.provider);
      setStatus(result);
      useRuntime.getState().setConnected(s.provider, result.configured);
      if (result.error) setNotice(result.error);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setWorking(false);
    }
  };
  useEffect(() => {
    let active = true;
    setKey("");
    setStatus(null);
    setNotice("");
    loadProvider(s.provider)
      .then((result) => {
        if (!active) return;
        setStatus(result);
        useRuntime.getState().setConnected(s.provider, result.configured);
        if (result.error) setNotice(result.error);
      })
      .catch((e) => {
        if (active) setNotice(e.message);
      });
    return () => {
      active = false;
    };
  }, [s.provider]);
  const action = async (kind: "save" | "remove" | "test") => {
    setWorking(true);
    setNotice("");
    try {
      await configureProvider(
        s.provider,
        kind,
        kind === "save" ? { key } : { model: s.model, zeroCostOnly: s.zeroCostOnly },
      );
      setKey("");
      const result = await loadProvider(s.provider);
      setStatus(result);
      useRuntime.getState().setConnected(s.provider, result.configured);
      setNotice(
        kind === "test"
          ? `Modell ${s.model}: echte Anfrage erfolgreich.`
          : kind === "save"
            ? "Schlüssel sicher gespeichert. Modell wählen und Verbindung testen."
            : "Schlüssel entfernt.",
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div
      className="tab-in *:dialog-in fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-xl overflow-auto rounded-t-xl border bg-card p-5 md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-semibold">Einstellungen</h2>
          <Btn className="ml-auto" title="Einstellungen schließen" onClick={onClose}>
            <X size={18} />
          </Btn>
        </div>
        <div className="space-y-4 text-sm">
          <label className="block space-y-1">
            <span className="text-muted-foreground">Provider</span>
            <select
              className="field"
              value={s.provider}
              onChange={(e) => {
                const p = e.target.value as ProviderId;
                setSettings({ provider: p, model: "" });
              }}
            >
              {(Object.keys(PROVIDERS) as ProviderId[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDERS[p].name}
                </option>
              ))}
            </select>
          </label>
          {s.provider === "custom" && (
            <p className="text-xs text-muted-foreground">
              Server-Endpunkt:{" "}
              {status?.baseUrl || "Noch nicht konfiguriert (OPENVIBE_CUSTOM_BASE_URL)"}
            </p>
          )}
          <label className="block space-y-1">
            <span className="text-muted-foreground">API-Key für {PROVIDERS[s.provider].name}</span>
            <input
              aria-label="API-Key"
              type="password"
              autoComplete="off"
              className="field font-mono"
              placeholder={PROVIDERS[s.provider].keyHint}
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <span className="block text-xs text-muted-foreground">
              {status?.configured ? "Schlüssel hinterlegt" : "Kein Schlüssel hinterlegt"} ·
              verschlüsselt, für JavaScript unlesbar · 30 Tage
            </span>
          </label>
          {s.provider !== "custom" && (
            <a
              className="inline-flex items-center gap-1 text-xs text-primary underline"
              href={
                s.provider === "openrouter"
                  ? "https://openrouter.ai/settings/keys"
                  : "https://huggingface.co/settings/tokens"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <KeyRound size={13} /> API-Key bei {PROVIDERS[s.provider].name} erstellen ↗
            </a>
          )}
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" disabled={working || !key} onClick={() => void action("save")}>
              <KeyRound size={14} /> Sicher speichern
            </Btn>
            <Btn
              variant="outline"
              disabled={working || !status?.configured || !s.model}
              onClick={() => void action("test")}
            >
              <PlugZap size={14} /> Verbindung testen
            </Btn>
            <Btn
              title="Schlüssel entfernen"
              disabled={working || !status?.configured}
              onClick={() => void action("remove")}
            >
              <Trash2 size={14} />
            </Btn>
            {s.provider === "openrouter" && (
              <Btn variant="outline" disabled={working} onClick={() => void savedKey()}>
                <KeyRound size={14} /> Gespeicherten Schlüssel verwenden
              </Btn>
            )}
          </div>
          {notice && (
            <p
              role="status"
              className="break-words whitespace-pre-wrap border-l-2 border-primary pl-2 text-xs"
            >
              {notice}
            </p>
          )}
          <label className="block space-y-1">
            <span className="text-muted-foreground">Modell</span>
            <input
              className="field font-mono"
              list="models"
              value={s.model}
              onChange={(e) => setSettings({ model: e.target.value })}
            />
            <datalist id="models">
              {modelIds.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>
          {s.provider === "openrouter" && status?.recommendedModel && (
            <Btn
              variant="outline"
              onClick={() => {
                if (status.recommendedModel) setSettings({ model: status.recommendedModel });
              }}
            >
              Kostenloses Coding-Modell wählen
            </Btn>
          )}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={s.zeroCostOnly}
              onChange={(e) => setSettings({ zeroCostOnly: e.target.checked })}
            />{" "}
            0€-Schutz · nur aktuell vollständig kostenlose Modelle
          </label>
          <div className="flex items-center gap-2">
            {s.provider === "openrouter" && (
              <label className="flex flex-1 items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={freeOnly}
                  onChange={(e) => setFreeOnly(e.target.checked)}
                />{" "}
                Nur aktuell ohne Tokenpreis
              </label>
            )}
            <Btn
              title="Modellkatalog aktualisieren"
              disabled={working}
              onClick={() => void refresh()}
            >
              <RefreshCw size={14} />
            </Btn>
          </div>
          <select
            aria-label="Modellkatalog"
            className="field"
            value={modelIds.includes(s.model) ? s.model : ""}
            onChange={(e) => setSettings({ model: e.target.value })}
          >
            <option value="">Modell aus aktuellem Katalog wählen</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.free ? " · 0 Tokenpreis" : ""}
              </option>
            ))}
            {s.customModels
              .filter((id) => !models.some((m) => m.id === id))
              .map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
          </select>
          <p className="text-xs text-muted-foreground">
            0 Tokenpreis garantiert keine Verfügbarkeit oder freien Kontingente. Verbindungstest
            sendet eine kurze Anfrage.
          </p>
          <div className="flex gap-2">
            <input
              className="field font-mono"
              placeholder="Eigenes Modell merken: org/model"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
            />
            <Btn
              variant="outline"
              className="h-auto"
              onClick={() => {
                if (newModel.trim()) {
                  setSettings({
                    customModels: [...new Set([...s.customModels, newModel.trim()])],
                    model: newModel.trim(),
                  });
                  setNewModel("");
                }
              }}
            >
              Merken
            </Btn>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-muted-foreground">Temperatur {s.temperature}</span>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={s.temperature}
                onChange={(e) => setSettings({ temperature: +e.target.value })}
                className="w-full accent-primary"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-muted-foreground">Max Tokens</span>
              <input
                type="number"
                min={128}
                max={32768}
                className="field"
                value={s.maxTokens}
                onChange={(e) =>
                  setSettings({
                    maxTokens: Math.min(32768, Math.max(128, +e.target.value || 4096)),
                  })
                }
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-muted-foreground">
              Zusatz-Systemprompt für <span className="font-mono">{s.model.split("/").pop()}</span>
            </span>
            <textarea
              rows={3}
              className="field font-mono text-xs"
              value={s.modelPrompts[s.model] ?? ""}
              onChange={(e) =>
                setSettings({ modelPrompts: { ...s.modelPrompts, [s.model]: e.target.value } })
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="flex text-muted-foreground">
              Agent-Systemprompt{" "}
              <Btn
                className="ml-auto text-xs"
                onClick={() => setSettings({ agentPrompt: DEFAULT_AGENT_PROMPT })}
              >
                Zurücksetzen
              </Btn>
            </span>
            <textarea
              rows={6}
              className="field font-mono text-xs"
              value={s.agentPrompt}
              onChange={(e) => setSettings({ agentPrompt: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="flex text-muted-foreground">
              Chat-Systemprompt{" "}
              <Btn
                className="ml-auto text-xs"
                onClick={() => setSettings({ chatPrompt: DEFAULT_CHAT_PROMPT })}
              >
                Zurücksetzen
              </Btn>
            </span>
            <textarea
              rows={3}
              className="field font-mono text-xs"
              value={s.chatPrompt}
              onChange={(e) => setSettings({ chatPrompt: e.target.value })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
