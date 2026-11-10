import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const p = await import("@/lib/studio/provider.server");
        try {
          p.assertSameOrigin(request);
          const data = p.chatSchema.parse(await p.readBoundedBody(request));
          const key = await p.readCredential(data.provider);
          if (!key) return Response.json({ error: "Bitte zuerst den Anbieter in den Einstellungen verbinden." }, { status: 401 });
          await p.assertZeroCostModel(data.provider, data.model, data.zeroCostOnly, p.hasImages(data.messages));
          const upstream = await p.providerFetch(data.provider, key, "/chat/completions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data.provider ? { model: data.model, messages: data.messages, stream: data.stream, temperature: data.temperature, max_tokens: data.max_tokens } : {}), signal: AbortSignal.any([request.signal, AbortSignal.timeout(120000)]) });
          if (!upstream.ok) return upstream;
          const { LIMITS } = await import("@/lib/studio/limits");
          let size = 0;
          const bounded = new TransformStream<Uint8Array, Uint8Array>({ transform(chunk, stream) { size += chunk.length; if (size > LIMITS.responseBytes) { stream.error(new Error("Antwort zu groß.")); return; } stream.enqueue(chunk); } });
          return new Response(upstream.body?.pipeThrough(bounded), { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") ?? "text/event-stream", "cache-control": "no-store" } });
        } catch (e) { return p.routeError(e); }
      },
    },
  },
});
