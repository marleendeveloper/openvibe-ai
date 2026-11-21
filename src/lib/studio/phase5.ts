import type { ModelInfo } from "./providers";

export const IMAGE_LIMITS = {
  count: 3,
  inputBytes: 2 * 1024 * 1024,
  dataUrlChars: 1_200_000,
  types: ["image/png", "image/jpeg", "image/webp"],
} as const;
export const RETRY = { attempts: 2, delays: [1500, 3500] } as const;

/** Only transport failures are retried; provider refusals, limits and the 0€ guard are final. */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return false;
  const msg = error instanceof Error ? error.message : String(error);
  if (/0€-Schutz|Tokenlimit|zu groß|verbinden|401|403|402|Ungültig|Modell/i.test(msg)) return false;
  return (
    error instanceof TypeError ||
    /error reading a body|unterbrochen|failed to fetch|networkerror|network|connection|ECONNRESET|timed? ?out|\b50[234]\b/i.test(
      msg,
    )
  );
}

/** Free models tried in order when the chosen free model is overloaded (HTTP 503/429). */
export const OVERLOAD_FALLBACKS = [
  "nvidia/nemotron-3.5-super-vl:free",
  "google/gemma-4-31b-it:free",
] as const;

export function isOverloadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /\b(503|429)\b|overload|überlast|nicht erreichbar/i.test(msg);
}

/** Fallbacks are only offered while the 0€ guard is on, so the server re-verifies live free pricing. */
export function overloadFallbacks(model: string, zeroCostOnly: boolean): string[] {
  if (!zeroCostOnly || !model.endsWith(":free")) return [];
  return OVERLOAD_FALLBACKS.filter((m) => m !== model);
}

export function validateImageFile(
  file: { type: string; size: number },
  existing: number,
): string | null {
  if (existing >= IMAGE_LIMITS.count) return `Maximal ${IMAGE_LIMITS.count} Bilder pro Auftrag.`;
  if (!(IMAGE_LIMITS.types as readonly string[]).includes(file.type))
    return "Nur PNG, JPG oder WebP.";
  if (file.size > IMAGE_LIMITS.inputBytes) return "Bild ist größer als 2 MB.";
  return null;
}

export function validDataUrl(url: string): boolean {
  return (
    url.length <= IMAGE_LIMITS.dataUrlChars &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url)
  );
}

// Ordered preference among live zero-priced, image-capable models.
const VISION_PREFERENCE = [
  "nvidia/nemotron-3.5-super-vl:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
];
export function freeVisionModel(models: ModelInfo[]): string | undefined {
  const ok = (id: string) => models.some((m) => m.id === id && m.free && m.vision);
  return (
    VISION_PREFERENCE.find(ok) ??
    models.find((m) => m.free && m.vision && m.id !== "openrouter/free")?.id
  );
}

/** Large tasks are planned into steps first. */
/** Starter and live-demo prompts describe one bounded app, built in one step. */
export const needsPlan = (prompt: string) =>
  !/^\s*(Live-Demo|App-Start):/i.test(prompt) &&
  (prompt.trim().length > 280 || (prompt.match(/[,.;\n]/g)?.length ?? 0) >= 6);

export function parsePlan(text: string): string[] {
  const clean = text.replace(/<think>[\s\S]*?(<\/think>|$)/g, "");
  const json = clean.match(/\[[\s\S]*\]/)?.[0];
  if (json) {
    try {
      const arr = JSON.parse(json);
      if (Array.isArray(arr))
        return arr
          .filter((s): s is string => typeof s === "string" && !!s.trim())
          .map((s) => s.trim().slice(0, 400))
          .slice(0, 4);
    } catch {
      /* fall back to list parsing */
    }
  }
  return clean
    .split("\n")
    .map((l) => l.replace(/^\s*(\d+[.)]|[-*])\s*/, "").trim())
    .filter((l) => l.length > 3)
    .slice(0, 4);
}
