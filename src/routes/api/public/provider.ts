import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/provider")({
  server: { handlers: {
    GET: async ({ request }) => {
      const p = await import("@/lib/studio/provider.server");
      try {
        const provider = p.providerSchema.parse(new URL(request.url).searchParams.get("provider"));
        const key = await p.readCredential(provider);
        let models = [];
        let error;
        try { models = await p.modelCatalog(provider, key); } catch (e) { error = (e as Error).message; }
        return Response.json({ configured: !!key, baseUrl: p.baseUrl(provider), models, error }, { headers: { "cache-control": "no-store" } });
      } catch (e) { return p.routeError(e); }
    },
    POST: async ({ request }) => {
      const p = await import("@/lib/studio/provider.server");
      try {
        p.assertSameOrigin(request);
        const data = await p.readBoundedBody(request);
        const provider = p.providerSchema.parse(data.provider);
        if (data.action === "remove") { p.removeCredential(provider); return Response.json({ configured: false }); }
        if (data.action === "save") {
          if (typeof data.key !== "string" || data.key.length < 10 || data.key.length > 512 || /\s/.test(data.key)) return Response.json({ error: "Ungültiges Schlüsselformat." }, { status: 400 });
          await p.saveCredential(provider, data.key, request);
          return Response.json({ configured: true }, { headers: { "cache-control": "no-store" } });
        }
        if (data.action !== "test" || typeof data.model !== "string" || !data.model || data.model.length > 200) return Response.json({ error: "Ungültiger Verbindungstest." }, { status: 400 });
        const key = await p.readCredential(provider);
        if (!key) return Response.json({ error: "Bitte zuerst einen Schlüssel sicher speichern." }, { status: 401 });
        const response = await p.providerFetch(provider, key, "/chat/completions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: data.model, messages: [{ role: "user", content: "Reply with OK." }], max_tokens: 64, stream: false }) });
        if (!response.ok) return response;
        const result = await response.json();
        if (result.error || !result.choices?.[0]?.message) return Response.json({ error: "Anbieter hat keine gültige Modellantwort geliefert." }, { status: 502 });
        return Response.json({ ok: true, model: data.model }, { headers: { "cache-control": "no-store" } });
      } catch (e) { return p.routeError(e); }
    },
  } },
});