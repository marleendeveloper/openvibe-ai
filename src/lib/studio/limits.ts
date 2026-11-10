export const LIMITS = {
  requestBytes: 1_500_000,
  responseBytes: 2_000_000,
  fileBytes: 500_000,
  projectBytes: 1_000_000,
  files: 100,
  operations: 100,
  messages: 24,
  maxTokens: 32768,
  repairs: 5,
} as const;

export const byteSize = (text: string) => new TextEncoder().encode(text).length;

export function safePath(input: string): string {
  const path = input.trim().replace(/\\/g, "/");
  const parts = path.replace(/^\//, "").split("/");
  if (!path || path.length > 240 || /[\x00-\x1f<>:"|?*]/.test(path) || parts.some((p) => !p || p === "." || p === ".." || p === ".git" || p === "node_modules") || parts.some((p) => /^\.env(?:\.|$)/.test(p))) {
    throw new Error(`Unsicherer Dateipfad: ${input.slice(0, 240)}`);
  }
  return "/" + parts.join("/");
}

export function validateFiles(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Ungültige Projektdateien.");
  const entries = Object.entries(input);
  if (entries.length > LIMITS.files) throw new Error(`Maximal ${LIMITS.files} Dateien pro Projekt.`);
  const files: Record<string, string> = {};
  let total = 0;
  for (const [path, content] of entries) {
    if (typeof content !== "string" || byteSize(content) > LIMITS.fileBytes) throw new Error("Datei ist ungültig oder zu groß.");
    total += byteSize(content);
    if (total > LIMITS.projectBytes) throw new Error("Das Projekt überschreitet 1 MB.");
    files[safePath(path)] = content;
  }
  return files;
}