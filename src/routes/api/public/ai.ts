import { createFileRoute } from "@tanstack/react-router";
import { PROXY_HOSTS } from "@/lib/studio/providers";

// Stateless streaming relay. Stores nothing; the caller supplies their own key.
// Only forwards to allow-listed AI hosts so it can't be used as a general proxy.
export const Route = createFileRoute("/api/public/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const target = request.headers.get("x-target-url") ?? "";
        const auth = request.headers.get("authorization") ?? "";
        let url: URL;
        try {
          url = new URL(target);
        } catch {
          return new Response("bad target", { status: 400 });
        }
        if (url.protocol !== "https:" || !PROXY_HOSTS.includes(url.hostname) || !url.pathname.endsWith("/chat/completions")) {
          return new Response("target not allowed", { status: 403 });
        }
        if (!auth) return new Response("missing key", { status: 401 });
        const upstream = await fetch(url.toString(), {
          method: "POST",
          headers: { "content-type": "application/json", authorization: auth },
          body: await request.text(),
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: { "content-type": upstream.headers.get("content-type") ?? "text/event-stream", "cache-control": "no-cache" },
        });
      },
    },
  },
});
