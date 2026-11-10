// Parses AI file operations out of a model response.
// Format the agent is instructed to use:
//   <file path="/App.tsx">...full content...</file>
//   <delete path="/old.ts" />
export type FileOp =
  | { type: "write"; path: string; content: string }
  | { type: "delete"; path: string };

export function normalizePath(p: string): string {
  const t = p.trim().replace(/\\/g, "/");
  return t.startsWith("/") ? t : "/" + t;
}

function stripFence(content: string): string {
  let c = content.replace(/^\r?\n/, "");
  const m = c.match(/^\s*```[\w-]*\r?\n([\s\S]*?)\r?\n?```\s*$/);
  if (m) c = m[1] ?? "";
  return c.replace(/\s+$/, "") + "\n";
}

export function parseFileOps(text: string): FileOp[] {
  const ops: FileOp[] = [];
  const re = /<file\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file>|<delete\s+path=["']([^"']+)["']\s*\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[1]) ops.push({ type: "write", path: normalizePath(m[1]), content: stripFence(m[2] ?? "") });
    else if (m[3]) ops.push({ type: "delete", path: normalizePath(m[3]) });
  }
  return ops;
}

/** Text with file blocks collapsed, for display in chat. */
export function summarizeResponse(text: string): string {
  return text
    .replace(/<file\s+path=["']([^"']+)["']\s*>[\s\S]*?(<\/file>|$)/g, (_m, p, end) =>
      end ? `📄 ${normalizePath(p)}` : `✍️ writing ${normalizePath(p)}…`,
    )
    .replace(/<delete\s+path=["']([^"']+)["']\s*\/?>/g, (_m, p) => `🗑 ${normalizePath(p)}`);
}
