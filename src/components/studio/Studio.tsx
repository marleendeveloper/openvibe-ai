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
  MoreHorizontal,
} from "lucide-react";
import { useStudio, useProject } from "@/lib/studio/store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { startupFreeModel } from "@/lib/studio/providers";
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
  const [filesOpen, setFilesOpen] = useState(false);
  const project = useProject();
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
        if (current.provider !== settings.provider) return;
        const model =
          current.provider === "openrouter" && current.zeroCostOnly
            ? startupFreeModel(current.model, status.models)
            : !current.model
              ? status.recommendedModel
              : undefined;
        if (model) useStudio.getState().setSettings({ model });
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
        const status = await loadProvider("openrouter");
        const model = startupFreeModel("", status.models);
        useStudio.getState().setSettings({
          provider: "openrouter",
          model: model ?? "",
          zeroCostOnly: true,
        });
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
    <header className="grid h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b bg-panel/80 px-3 backdrop-blur">
      <div className="min-w-0">
        <span className="flex min-w-0 items-center gap-2 text-sm font-extrabold">
          <span className="grid size-7 place-items-center rounded-lg brand-gradient text-xs text-primary-foreground">
            ▲
          </span>
          OpenVibe
        </span>
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={project.name}>
          {project.name}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Btn variant="outline" title="Projekt-Übersicht" onClick={() => setOverviewOpen(true)}>
          <LayoutGrid size={17} /> Projekte
        </Btn>
        {!hasKey && (
          <Btn
            variant="primary"
            title="KI-Anbieter verbinden"
            onClick={() => setSettingsOpen(true)}
          >
            <KeyRound size={14} />
            <span className="hidden whitespace-nowrap sm:inline">
              <span className="hidden sm:inline">API-</span>Key
            </span>
          </Btn>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Btn title="Weitere Werkzeuge" aria-label="Weitere Werkzeuge">
              <MoreHorizontal size={20} />
            </Btn>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setPublishOpen(true)}>
              <Globe size={16} className="mr-2" /> App veröffentlichen
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setReviewOpen(true)}>
              <ShieldCheck size={16} className="mr-2" /> Code prüfen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
              <Cog size={16} className="mr-2" /> Einstellungen
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAccountOpen(true)}>
              <UserRound size={16} className="mr-2" /> Mein Profil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );

  if (isDesktop) {
    return (
      <div className="flex h-dvh flex-col">
        {header}
        <div
          className={cn(
            "grid min-h-0 flex-1",
            filesOpen
              ? "grid-cols-[200px_minmax(280px,1fr)_minmax(320px,1.3fr)]"
              : "grid-cols-[minmax(320px,1fr)_minmax(380px,1.3fr)]",
          )}
        >
          {filesOpen && (
            <aside className="min-h-0 border-r">
              <FileTree onOpen={() => setRightTab("code")} />
            </aside>
          )}
          <section className="min-h-0 min-w-0 border-r">
            <Chat />
          </section>
          <section className="flex min-h-0 flex-col">
            <div className="flex gap-1 border-b bg-panel px-2 py-1">
              <Btn
                className={cn(rightTab === "preview" && "bg-primary/20 text-primary")}
                onClick={() => setRightTab("preview")}
              >
                <Play size={14} /> Vorschau
              </Btn>
              <Btn
                className={cn(rightTab === "code" && "bg-primary/20 text-primary")}
                onClick={() => setRightTab("code")}
              >
                <Code2 size={14} /> Code
              </Btn>
              <Btn
                className={cn("ml-auto", filesOpen && "text-primary")}
                aria-pressed={filesOpen}
                onClick={() => setFilesOpen(!filesOpen)}
                title="Projektdateien ein- oder ausblenden"
              >
                <Folder size={14} /> Dateien
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
    { id: "chat", label: "Erstellen", icon: MessageSquare },
    { id: "preview", label: "Vorschau", icon: Play },
    { id: "code", label: "Code", icon: Code2 },
    { id: "files", label: "Dateien", icon: Folder },
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
            aria-pressed={mobileTab === t.id}
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
