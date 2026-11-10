import { createFileRoute } from "@tanstack/react-router";
import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import { useMemo } from "react";
import { loadPublishedApp } from "@/lib/studio/cloud.functions";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const app = await loadPublishedApp({ data: { slug: params.slug } });
    return { app, slug: params.slug };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.app?.title ?? "App";
    return {
      meta: [
        { title: `${title} · OpenVibe App` },
        { name: "description", content: `Mit OpenVibe veröffentlichte App: ${title}` },
        { property: "og:title", content: title },
        { property: "og:description", content: `Mit OpenVibe veröffentlichte App: ${title}` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PublishedPage,
});

function PublishedPage() {
  const { app } = Route.useLoaderData();
  const files = useMemo(() => {
    if (!app) return {};
    const all = app.files as Record<string, string>;
    return Object.fromEntries(Object.entries(all).filter(([p]) => p !== "/package.json"));
  }, [app]);
  const customSetup = useMemo(() => {
    if (!app) return { dependencies: {} };
    try {
      return { dependencies: JSON.parse((app.files as Record<string, string>)["/package.json"] ?? "{}").dependencies ?? {} };
    } catch {
      return { dependencies: {} };
    }
  }, [app]);

  if (!app) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">App nicht gefunden</h1>
          <p className="text-sm text-muted-foreground">Dieser Link ist ungültig oder die Veröffentlichung wurde zurückgenommen.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-10 shrink-0 items-center gap-2 border-b bg-panel px-3">
        <span className="font-mono text-xs font-bold"><span className="text-primary">▲</span> {app.title}</span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">mit OpenVibe erstellt</span>
      </header>
      <div className="min-h-0 flex-1">
        <SandpackProvider template="react-ts" files={files} customSetup={customSetup} theme="dark" options={{ initMode: "immediate", recompileMode: "delayed", recompileDelay: 400 }}>
          <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} style={{ height: "100%" }} />
        </SandpackProvider>
      </div>
    </div>
  );
}
