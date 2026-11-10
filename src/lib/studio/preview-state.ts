import { useRuntime } from "./runtime";

export function filesRevision(files: Record<string, string>) {
  let hash = 2166136261;
  for (const [path, value] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    for (const c of `${path}\0${value}\0`) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  }
  return (hash >>> 0).toString(36);
}

export async function waitForPreview(projectId: string, revision: string, signal: AbortSignal, timeout = 45000) {
  const start = Date.now();
  let stable = 0;
  while (Date.now() - start < timeout) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const state = useRuntime.getState().preview;
    if (state?.projectId === projectId && state.revision === revision) {
      if (state.status === "error" && state.error) return { error: state.error, verified: true };
      if (state.status === "ready") {
        stable ||= Date.now();
        if (Date.now() - stable >= 2000) return { error: null, verified: true };
      } else stable = 0;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return { error: null, verified: false };
}

export function repairDecision(attempt: number, error: string, seen: Set<string>): "repair" | "repeat" | "limit" {
  const fingerprint = error.trim().replace(/\s+/g, " ");
  if (seen.has(fingerprint)) return "repeat";
  if (attempt >= 5) return "limit";
  seen.add(fingerprint);
  return "repair";
}