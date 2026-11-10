import { useEffect, useState } from "react";
import { Folder, MessageSquare, Code2, Play, Settings as Cog, KeyRound } from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import { FileTree } from "./FileTree";
import { Chat } from "./Chat";
import { CodeEditor } from "./CodeEditor";
import { Preview } from "./Preview";
import { Settings } from "./Settings";
import { Btn } from "./ui";
import { cn } from "@/lib/utils";

type Tab = "files" | "chat" | "code" | "preview";

export default function Studio() {
  const [mobileTab, setMobileTab] = useState<Tab>("chat");
  const [rightTab, setRightTab] = useState<"preview" | "code">("preview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings } = useStudio();
  const hasKey = !!settings.keys[settings.provider];
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const f = () => setIsDesktop(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  const header = (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-panel px-3">
      <span className="font-mono text-sm font-bold tracking-tight"><span className="text-primary">▲</span> OpenVibe</span>
      <span className="hidden truncate font-mono text-xs text-muted-foreground sm:inline">· {settings.model}</span>
      <div className="ml-auto flex items-center gap-1">
        {!hasKey && <Btn variant="primary" onClick={() => setSettingsOpen(true)}><KeyRound size={14} /> API-Key setzen</Btn>}
        <Btn title="Einstellungen" onClick={() => setSettingsOpen(true)}><Cog size={17} /></Btn>
      </div>
    </header>
  );

  if (isDesktop) {
    return (
      <div className="flex h-dvh flex-col">
        {header}
        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(360px,1fr)_minmax(420px,1.3fr)]">
          <aside className="min-h-0 border-r"><FileTree onOpen={() => setRightTab("code")} /></aside>
          <section className="min-h-0 border-r"><Chat /></section>
          <section className="flex min-h-0 flex-col">
            <div className="flex gap-1 border-b bg-panel px-2 py-1">
              <Btn className={cn(rightTab === "preview" && "bg-accent text-foreground")} onClick={() => setRightTab("preview")}><Play size={14} /> Live</Btn>
              <Btn className={cn(rightTab === "code" && "bg-accent text-foreground")} onClick={() => setRightTab("code")}><Code2 size={14} /> Code</Btn>
            </div>
            <div className="relative min-h-0 flex-1">
              <div className={cn("absolute inset-0", rightTab !== "preview" && "invisible")}><Preview /></div>
              {rightTab === "code" && <div className="absolute inset-0 bg-background"><CodeEditor /></div>}
            </div>
          </section>
        </div>
        {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
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
        <div className={cn("absolute inset-0", mobileTab !== "files" && "hidden")}><FileTree onOpen={() => setMobileTab("code")} /></div>
        <div className={cn("absolute inset-0", mobileTab !== "chat" && "hidden")}><Chat /></div>
        {mobileTab === "code" && <div className="absolute inset-0"><CodeEditor /></div>}
        <div className={cn("absolute inset-0", mobileTab !== "preview" && "invisible")}><Preview /></div>
      </main>
      <nav className="grid shrink-0 grid-cols-4 border-t bg-panel pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setMobileTab(t.id)} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px]", mobileTab === t.id ? "text-primary" : "text-muted-foreground")}>
            <t.icon size={19} />{t.label}
          </button>
        ))}
      </nav>
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
