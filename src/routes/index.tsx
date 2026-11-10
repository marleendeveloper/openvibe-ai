import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Studio = lazy(() => import("@/components/studio/Studio"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpenVibe – Private AI Coding Studio" },
      {
        name: "description",
        content:
          "Privates Vibe-Coding-Studio mit freier Modellwahl über Hugging Face und OpenRouter.",
      },
      { property: "og:title", content: "OpenVibe – Private AI Coding Studio" },
      {
        property: "og:description",
        content: "Websites und Apps per natürlicher Sprache bauen, mit Live-Preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Index,
});

const Loading = () => (
  <div className="grid h-dvh place-items-center font-mono text-sm text-primary">
    openvibe://booting…
  </div>
);

function Index() {
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <Studio />
      </Suspense>
    </ClientOnly>
  );
}
