import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isOwnerEmail } from "./owner";

/** Authenticated AND the studio owner; everyone else is rejected server-side. */
export const requireOwner = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(({ next, context }) => {
    if (!isOwnerEmail((context.claims as { email?: string }).email)) throw new Response("Forbidden", { status: 403 });
    return next();
  });

/** For plain server routes: validates a bearer token and the owner email. */
export async function assertOwnerRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("owner");
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const client = createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !isOwnerEmail(data.user?.email)) throw new Error("owner");
}
