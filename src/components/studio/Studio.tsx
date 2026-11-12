import { lazy, Suspense, useEffect, useState } from "react";
import {
  Folder,
  MessageSquare,
  Code2,
  Play,
  Settings as Cog,
  KeyRound,
  ShieldCheck,
  UserRound,
  Globe,
  LayoutGrid,
} from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import { FileTree } from "./FileTree";
import { Chat } from "./Chat";
const LazyCodeEditor = lazy(() => import("./CodeEditor").then((m) => ({ default: m.CodeEditor })));
const LazyPreview = lazy(() => import("./Preview").then((m) => ({ default: m.Preview })));
const Loading = () => <div className="skeleton h-full w-full" />;
const CodeEditor = () => (
  <Suspense fallback={<Loading />}>
    <LazyCodeEditor />
  </Suspense>
);
const Preview = () => (
  <Suspense fallback={<Loading />}>
    <LazyPreview />
  </Suspense>
);
import { Settings } from "./Settings";
import { Btn } from "./ui";
import { cn } from "@/lib/utils";
import { useRuntime } from "@/lib/studio/runtime";
import { loadProvider } from "@/lib/studio/provider-client";
import { CodeReview } from "./CodeReview";
import { Account } from "./Account";
import { Publish } from "./Publish";
import { Overview } from "./Overview";
import { useAccount } from "@/lib/studio/auth-state";
import { OwnerGate } from "./Passkeys";
import { isOwnerEmail } from "@/lib/studio/owner";
import { useServerFn } from "@tanstack/react-start";
import { autoConnectSavedOpenRouter, AUTO_KEY_EMAILS } from "@/lib/studio/saved-provider.functions";

type Tab = "files" | "chat" | "code" | "preview";

export default function Studio() {
  const [mobileTab, setMobileTab] = useState<Tab>("chat");
  const [rightTab, setRightTab] = useState<"preview" | "code">("preview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const { user, loading } = useAccount();
  const { settings } = useStudio();
  const hasKey = useRuntime((s) => s.connected[settings.provider]);
  useEffect(() => {
    let active = true;
    loadProvider(settings.provider)
      .then((status) => {
        if (!active) return;
        useRuntime.getState().setConnected(settings.provider, status.configured);
        const current = useStudio.getState().settings;
        if (current.provider === settings.provider && !current.model && status.recommendedModel)
          useStudio.getState().setSettings({ model: status.recommendedModel });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [settings.provider]);
  const autoConnect = useServerFn(autoConnectSavedOpenRouter);
  useEffect(() => {
    const email = user?.email?.toLowerCase();
    if (!email || !AUTO_KEY_EMAILS.includes(email) || hasKey) return;
    autoConnect()
      .then(async (r) => {
        if (!r.configured) return;
        useStudio.getState().setSettings({
          provider: "openrouter",
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          zeroCostOnly: true,
        });
        const status = await loadProvider("openrouter");
        useRuntime.getState().setConnected("openrouter", status.configured);
      })
      .catch(() => undefined);
  }, [user?.email, hasKey, autoConnect]);
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const f = () => setIsDesktop(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  if (loading)
    return (
      <div className="grid h-dvh place-items-center font-mono text-sm text-primary">
        openvibe://booting…
      </div>
    );
  if (!user || !isOwnerEmail(user.email)) return <OwnerGate />;

  const header = (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-panel/80 px-3 backdrop-blur">
      <span className="flex shrink-0 items-center gap-2 text-sm font-extrabold uppercase tracking-[0.2em]">
        <span className="grid size-7 place-items-center rounded-lg brand-gradient text-xs text-primary-foreground">
          ▲
        </span>
        OpenVibe
      </span>
      <span className="hidden truncate font-mono text-xs text-muted-foreground sm:inline">
        · {settings.model}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <Btn
          title={user ? "Mein Profil" : "Anmelden / Registrieren"}
          onClick={() => setAccountOpen(true)}
          className={cn(user && "text-primary")}
        >
          <UserRound size={17} />
        </Btn>
        <Btn title="Projekt-Übersicht" onClick={() => setOverviewOpen(true)}>
          <LayoutGrid size={17} />
        </Btn>
        <Btn title="Code prüfen" onClick={() => setReviewOpen(true)}>
          <ShieldCheck size={17} />
        </Btn>
        <Btn title="App veröffentlichen" onClick={() => setPublishOpen(true)}>
          <Globe size={17} />
        </Btn>
        {!hasKey && (
          <Btn variant="primary" onClick={() => setSettingsOpen(true)}>
            <KeyRound size={14} />
            <span className="whitespace-nowrap">
              <span className="hidden sm:inline">API-</span>Key
            </span>
          </Btn>
        )}
        <Btn title="Einstellungen" onClick={() => setSettingsOpen(true)}>
          <Cog size={17} />
        </Btn>
      </div>
    </header>
  );

  if (isDesktop) {
    return (
      <div className="flex h-dvh flex-col">
        {header}
        <div className="grid min-h-0 flex-1 grid-cols-[200px_minmax(280px,1fr)_minmax(320px,1.3fr)]">
          <aside className="min-h-0 border-r">
            <FileTree onOpen={() => setRightTab("code")} />
          </aside>
          <section className="min-h-0 border-r">
            <Chat />
          </section>
          <section className="flex min-h-0 flex-col">
            <div className="flex gap-1 border-b bg-panel px-2 py-1">
              <Btn
                className={cn(rightTab === "preview" && "bg-primary/20 text-primary")}
                onClick={() => setRightTab("preview")}
              >
                <Play size={14} /> Live
              </Btn>
              <Btn
                className={cn(rightTab === "code" && "bg-primary/20 text-primary")}
                onClick={() => setRightTab("code")}
              >
                <Code2 size={14} /> Code
              </Btn>
            </div>
            <div className="relative min-h-0 flex-1">
              <div className={cn("tab-in absolute inset-0", rightTab !== "preview" && "hidden")}>
                <Preview />
              </div>
              {rightTab === "code" && (
                <div className="tab-in absolute inset-0 bg-background">
                  <CodeEditor />
                </div>
              )}
            </div>
          </section>
        </div>
        {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
        {reviewOpen && <CodeReview onClose={() => setReviewOpen(false)} />}
        {accountOpen && <Account onClose={() => setAccountOpen(false)} />}
        {publishOpen && <Publish onClose={() => setPublishOpen(false)} />}
        {overviewOpen && (
          <Overview
            onClose={() => setOverviewOpen(false)}
            onSignIn={() => {
              setOverviewOpen(false);
              setAccountOpen(true);
            }}
          />
        )}
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Folder }[] = [
    { id: "files", label: "Dateien", icon: Folder },
    { id: "chat", label: "KI", icon: MessageSquare },
    { id: "code", label: "Code", icon: Code2 },
    { id: "preview", label: "Preview", icon: Play },
  ];
  return (
    <div className="flex h-dvh flex-col">
      {header}
      <main className="relative min-h-0 flex-1">
        <div className={cn("tab-in absolute inset-0 z-10", mobileTab !== "files" && "hidden")}>
          <FileTree onOpen={() => setMobileTab("code")} />
        </div>
        <div
          className={cn(
            "tab-in absolute inset-0 z-10 bg-background",
            mobileTab !== "chat" && "hidden",
          )}
        >
          <Chat />
        </div>
        {mobileTab === "code" && (
          <div className="tab-in absolute inset-0 z-10 bg-background">
            <CodeEditor />
          </div>
        )}
        <div className={cn("tab-in absolute inset-0", mobileTab !== "preview" && "hidden")}>
          <Preview />
        </div>
      </main>
      <nav className="grid shrink-0 grid-cols-4 border-t bg-panel pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => (
          <Btn
            key={t.id}
            onClick={() => setMobileTab(t.id)}
            className={cn(
              "h-16 flex-col gap-1 rounded-none py-2 text-[11px] font-semibold",
              mobileTab === t.id ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-7 w-12 place-items-center rounded-full transition",
                mobileTab === t.id && "bg-primary/25 text-primary",
              )}
            >
              <t.icon size={19} />
            </span>
            {t.label}
          </Btn>
        ))}
      </nav>
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
      {reviewOpen && <CodeReview onClose={() => setReviewOpen(false)} />}
      {accountOpen && <Account onClose={() => setAccountOpen(false)} />}
      {publishOpen && <Publish onClose={() => setPublishOpen(false)} />}
      {overviewOpen && (
        <Overview
          onClose={() => setOverviewOpen(false)}
          onSignIn={() => {
            setOverviewOpen(false);
            setAccountOpen(true);
          }}
        />
      )}
    </div>
  );
}
