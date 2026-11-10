import { safePath, byteSize, LIMITS } from "./limits";
// Parses AI file operations out of a model response.
// Format the agent is instructed to use:
//   <file path="/App.tsx">...full content...</file>
//   <delete path="/old.ts" />
export type FileOp =
  | { type: "write"; path: string; content: string }
  | { type: "delete"; path: string };

export function normalizePath(p: string): string {
  return safePath(p);
}

function stripFence(content: string): string {
  let c = content.replace(/^\r?\n/, "");
  const m = c.match(/^\s*```[\w-]*\r?\n([\s\S]*?)\r?\n?```\s*$/);
  if (m) c = m[1] ?? "";
  return c.replace(/\s+$/, "") + "\n";
}

export function parseFileOps(text: string): FileOp[] {
  if (byteSize(text) > LIMITS.responseBytes) throw new Error("KI-Antwort ist zu groß.");
  const complete = text.replace(/<file\s+path=["'][^"']+["']\s*>[\s\S]*?<\/file>/g, "");
  if (/<file\s+path=/.test(complete)) return [];
  const ops: FileOp[] = [];
  const re = /<file\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file>|<delete\s+path=["']([^"']+)["']\s*\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[1]) ops.push({ type: "write", path: normalizePath(m[1]), content: stripFence(m[2] ?? "") });
    else if (m[3]) ops.push({ type: "delete", path: normalizePath(m[3]) });
  }
  validateOps(ops);
  return ops;
}

export function validateOps(ops: FileOp[]) {
  if (ops.length > LIMITS.operations) throw new Error("Zu viele Dateiänderungen.");
  const paths = new Set<string>();
  for (const op of ops) {
    const path = safePath(op.path);
    if (paths.has(path)) throw new Error(`Mehrdeutige Änderungen für ${path}.`);
    paths.add(path);
    if (op.type === "write" && byteSize(op.content) > LIMITS.fileBytes) throw new Error(`Datei zu groß: ${path}`);
  }
}

/** Text with file blocks collapsed, for display in chat. */
export function summarizeResponse(text: string): string {
  return text
    .replace(/<file\s+path=["']([^"']+)["']\s*>[\s\S]*?(<\/file>|$)/g, (_m, p, end) =>
      end ? `📄 ${p}` : `✍️ ${p}…`,
    )
    .replace(/<delete\s+path=["']([^"']+)["']\s*\/?>/g, (_m, p) => `🗑 ${p}`);
}
