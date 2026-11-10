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