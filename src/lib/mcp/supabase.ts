import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { Database } from "@/integrations/supabase/types";
import { isOwnerEmail } from "@/lib/studio/owner";

type RuntimeGlobals = typeof globalThis & { process?: { env?: Record<string, string | undefined> } };
const env = (names: string[]) => {
  for (const n of names) { const v = (globalThis as RuntimeGlobals).process?.env?.[n]?.trim(); if (v) return v; }
  return undefined;
};

/** Caller-scoped client (RLS applies). Only the studio owners may use any tool. */
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("supabaseForUser requires a verified OAuth token");
  if (!isOwnerEmail(ctx.getUserEmail())) throw new Error("Nur der Entwickler der KI darf diese Werkzeuge nutzen.");
  const url = env(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  const key = env(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"]);
  if (!url || !key) throw new Error("Backend ist nicht konfiguriert.");
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
