export type ProviderId = "huggingface" | "openrouter" | "custom";

export const PROVIDERS: Record<ProviderId, { name: string; baseUrl: string; keyHint: string }> = {
  huggingface: { name: "Hugging Face", baseUrl: "https://router.huggingface.co/v1", keyHint: "hf_…" },
  openrouter: { name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", keyHint: "sk-or-…" },
  custom: { name: "OpenAI-kompatibel", baseUrl: "", keyHint: "API-Key" },
};

export type ModelInfo = { id: string; name: string; free: boolean; context?: number };
export type ProviderStatus = { configured: boolean; baseUrl: string; models: ModelInfo[]; recommendedModel?: string; error?: string };

// Ordered preference, not a benchmark ranking. Only live zero-priced entries qualify.
export function recommendedFreeModel(models: ModelInfo[]): string | undefined {
  const candidates = ["nvidia/nemotron-3-ultra-550b-a55b:free", "cohere/north-mini-code:free", "openrouter/free"];
  return candidates.find((id) => models.some((model) => model.id === id && model.free));
}

export function hasZeroPricing(pricing: Record<string, unknown> | undefined): boolean {
  if (!pricing || pricing.prompt === undefined || pricing.completion === undefined) return false;
  return Object.values(pricing).every((value) => (typeof value === "string" || typeof value === "number") && Number.isFinite(Number(value)) && Number(value) === 0);
}

export function providerError(status: number, detail: string, retryAfter?: string | null): string {
  const messages: Record<number, string> = {
    401: "Schlüssel fehlt, ist abgelaufen oder ungültig.",
    402: "Der Anbieter verlangt Guthaben. Wähle einen anderen Anbieter oder ein verfügbares kostenloses Modell.",
    403: "Der Anbieter verweigert den Zugriff. Prüfe die Berechtigungen des Schlüssels und des Modells.",
    429: `Anfragelimit erreicht.${retryAfter ? ` Erneut versuchen nach ${retryAfter}.` : " Bitte später erneut versuchen oder Anbieter wechseln."}`,
  };
  return `HTTP ${status}: ${messages[status] ?? (status >= 500 ? "Der Anbieter ist derzeit nicht erreichbar. Bitte später versuchen oder Anbieter wechseln." : "Anfrage fehlgeschlagen.")}\n${detail.slice(0, 2000)}`;
}
