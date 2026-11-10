import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const useSavedOpenRouter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { saveCredential, GATEWAY_MARKER } = await import("./provider.server");
    const key = process.env["UDC_OPENROUTER_API_KEY"] && process.env["LOVABLE_API_KEY"] ? GATEWAY_MARKER : process.env["OPENROUTER_API_KEY"];
    if (!key) throw new Error("Kein gespeicherter OpenRouter-Schlüssel verfügbar.");
    await saveCredential("openrouter", key, getRequest());
    return { configured: true };
  });
/** Accounts that get the saved OpenRouter key automatically after sign-in. */
export const AUTO_KEY_EMAILS = ["marleendeveloper@gmail.com"];

export const autoConnectSavedOpenRouter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();
    if (!AUTO_KEY_EMAILS.includes(email)) return { configured: false };
    const { getRequest } = await import("@tanstack/react-start/server");
    const { saveCredential, GATEWAY_MARKER } = await import("./provider.server");
    const key = process.env["UDC_OPENROUTER_API_KEY"] && process.env["LOVABLE_API_KEY"] ? GATEWAY_MARKER : process.env["OPENROUTER_API_KEY"];
    if (!key) return { configured: false };
    await saveCredential("openrouter", key, getRequest());
    return { configured: true };
  });
