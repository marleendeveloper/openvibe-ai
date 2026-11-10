import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const useSavedOpenRouter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const key = process.env["OPENROUTER_API_KEY"];
    if (!key) throw new Error("Kein gespeicherter OpenRouter-Schlüssel verfügbar.");
    const { getRequest } = await import("@tanstack/react-start/server");
    const { saveCredential } = await import("./provider.server");
    await saveCredential("openrouter", key, getRequest());
    return { configured: true };
  });