import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProviderId } from "./providers";
import { validateOps, type FileOp } from "./parse";
import { safePath, validateFiles } from "./limits";

export type Files = Record<string, string>;
export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ops?: FileOp[];
  opsStatus?: "pending" | "applied" | "rejected";
  error?: string;
  baseFiles?: Files;
};
export type Snapshot = { id: string; at: number; label: string; files: Files };
export type Project = {
  id: string;
  name: string;
  files: Files;
  messages: Message[];
  history: Snapshot[];
  updatedAt: number;
};

export const DEFAULT_FILES: Files = {
  "/App.tsx": `export default function App() {
  return (
    <main className="min-h-screen grid place-items-center bg-zinc-950 text-zinc-100">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold">Hallo OpenVibe ✦</h1>
        <p className="text-zinc-400">Beschreibe im Chat, was gebaut werden soll.</p>
      </div>
    </main>
  );
}
`,
  "/index.tsx": `import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
`,
  "/styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
`,
  "/public/index.html": `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Preview</title>
  </head>
  <body><div id="root"></div></body>
</html>
`,
};

export const DEFAULT_AGENT_PROMPT = `You are OpenVibe, an autonomous senior full-stack engineer working inside a live React + TypeScript sandbox (Sandpack, react-ts template). Tailwind is available via CDN classes. Entry: /index.tsx renders /App.tsx. npm dependencies go in /package.json "dependencies" (create/merge it when needed; react, react-dom are present).

You do real work: you edit the project directly. Workflow:
1. Briefly state your understanding and a short numbered plan.
2. Output every created or changed file IN FULL using exactly:
<file path="/path/File.tsx">
...complete file content...
</file>
3. Delete files with <delete path="/path" />
4. End with one or two sentences on what changed.
Never output partial files or "rest unchanged" placeholders. Keep explanations short; spend tokens on code. Fix any reported errors at the root cause.`;

export const DEFAULT_CHAT_PROMPT = `You are a sharp, direct senior software engineer. Answer technical questions precisely and without unnecessary caveats. Use code blocks when useful.`;

type Settings = {
  provider: ProviderId;
  model: string;
  customModels: string[];
  temperature: number;
  maxTokens: number;
  agentPrompt: string;
  chatPrompt: string;
  /** model id -> extra system prompt */
  modelPrompts: Record<string, string>;
  mode: "agent" | "chat";
  autoApply: boolean;
  autoFix: boolean;
  shareProject: boolean;
};

type State = {
  settings: Settings;
  projects: Project[];
  currentId: string;
  activeFile: string;
  setSettings: (s: Partial<Settings>) => void;
  createProject: (name: string, files?: Files) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  selectProject: (id: string) => void;
  setActiveFile: (p: string) => void;
  writeFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (from: string, to: string) => void;
  applyOps: (ops: FileOp[], label: string, projectId?: string) => void;
  undo: () => void;
  restore: (snapId: string) => void;
  addMessage: (m: Message, projectId?: string) => void;
  updateMessage: (id: string, patch: Partial<Message>, projectId?: string) => void;
  clearChat: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export { uid };

const newProject = (name: string, files: Files = DEFAULT_FILES): Project => ({
  id: uid(),
  name,
  files: validateFiles(files),
  messages: [],
  history: [],
  updatedAt: Date.now(),
});

const first = newProject("Mein erstes Projekt");

export const useStudio = create<State>()(
  persist(
    (set, get) => {
      const patchCurrent = (fn: (p: Project) => Project, projectId = get().currentId) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === projectId ? { ...fn(p), updatedAt: Date.now() } : p)),
        }));
      return {
        settings: {
          provider: "openrouter",
          model: "",
          customModels: [],
          temperature: 0.4,
          maxTokens: 8192,
          agentPrompt: DEFAULT_AGENT_PROMPT,
          chatPrompt: DEFAULT_CHAT_PROMPT,
          modelPrompts: {},
          mode: "agent",
          autoApply: true,
          autoFix: true,
          shareProject: false,
        },
        projects: [first],
        currentId: first.id,
        activeFile: "/App.tsx",
        setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
        createProject: (name, files) => {
          const p = newProject(name, files);
          set((s) => ({ projects: [p, ...s.projects], currentId: p.id, activeFile: Object.keys(p.files)[0] ?? "/App.tsx", settings: { ...s.settings, shareProject: false } }));
        },
        deleteProject: (id) =>
          set((s) => {
            let projects = s.projects.filter((p) => p.id !== id);
            if (!projects.length) projects = [newProject("Neues Projekt")];
            return { projects, currentId: s.currentId === id ? (projects[0]?.id ?? s.currentId) : s.currentId };
          }),
        renameProject: (id, name) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)) })),
        selectProject: (id) => {
          const p = get().projects.find((x) => x.id === id);
          if (!p) return;
          set({ currentId: id, activeFile: p.files["/App.tsx"] !== undefined ? "/App.tsx" : Object.keys(p.files)[0] ?? "", settings: { ...get().settings, shareProject: false } });
        },
        setActiveFile: (activeFile) => set({ activeFile }),
        writeFile: (path, content) => patchCurrent((p) => ({ ...p, files: validateFiles({ ...p.files, [safePath(path)]: content }) })),
        deleteFile: (path) =>
          patchCurrent((p) => {
            safePath(path);
            const snap: Snapshot = { id: uid(), at: Date.now(), label: `Löschen: ${path}`, files: { ...p.files } };
            const files = { ...p.files };
            delete files[path];
            return { ...p, files, history: [snap, ...p.history].slice(0, 30) };
          }),
        renameFile: (from, to) => {
          safePath(from); safePath(to);
          patchCurrent((p) => {
            if (p.files[from] === undefined) return p;
            if (p.files[to] !== undefined) throw new Error("Zieldatei existiert bereits.");
            const snap: Snapshot = { id: uid(), at: Date.now(), label: `Umbenennen: ${from}`, files: { ...p.files } };
            const files = { ...p.files };
            files[to] = files[from] ?? "";
            delete files[from];
            return { ...p, files: validateFiles(files), history: [snap, ...p.history].slice(0, 30) };
          });
          if (get().activeFile === from) set({ activeFile: to });
        },
        applyOps: (ops, label, projectId = get().currentId) => {
          validateOps(ops);
          patchCurrent((p) => {
            const snap: Snapshot = { id: uid(), at: Date.now(), label, files: { ...p.files } };
            const files = { ...p.files };
            for (const op of ops) {
              if (op.type === "write") files[op.path] = op.content;
              else delete files[op.path];
            }
            return { ...p, files: validateFiles(files), history: [snap, ...p.history].slice(0, 30) };
          }, projectId);
          const w = ops.find((o) => o.type === "write");
          if (w && get().currentId === projectId) set({ activeFile: w.path });
        },
        undo: () => { const p = get().projects.find((p) => p.id === get().currentId); const snap = p?.history[0]; if (snap) get().restore(snap.id); },
        restore: (snapId) =>
          patchCurrent((p) => {
            const snap = p.history.find((h) => h.id === snapId);
            if (!snap) return p;
            const cur: Snapshot = { id: uid(), at: Date.now(), label: "Vor Wiederherstellung", files: p.files };
            const files = validateFiles(snap.files);
            const active = get().activeFile;
            if (files[active] === undefined) set({ activeFile: Object.keys(files)[0] ?? "" });
            return { ...p, files, history: [cur, ...p.history].slice(0, 30) };
          }),
        addMessage: (m, projectId) => patchCurrent((p) => ({ ...p, messages: [...p.messages, m] }), projectId),
        updateMessage: (id, patch, projectId) =>
          patchCurrent((p) => ({ ...p, messages: p.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }), projectId),
        clearChat: () => patchCurrent((p) => ({ ...p, messages: [] })),
      };
    },
    {
      name: "openvibe-studio", version: 2,
      migrate: (persisted) => {
        const old = persisted as { settings?: Record<string, unknown> };
        if (old.settings) {
          const { keys: _keys, customBaseUrl: _url, ...settings } = old.settings;
          old.settings = { ...settings, shareProject: false };
        }
        return old;
      },
      merge: (persisted, current) => {
        const data = persisted as Partial<State> | undefined;
        const projects = data?.projects?.map((p) => {
          try { return { ...p, files: validateFiles(p.files), history: p.history ?? [], messages: p.messages ?? [] }; } catch { return newProject(p.name); }
        });
        return { ...current, ...data, projects: projects?.length ? projects : current.projects, settings: { ...current.settings, ...data?.settings } };
      },
    },
  ),
);

export const useProject = () => useStudio((s) => s.projects.find((p) => p.id === s.currentId) ?? s.projects[0] ?? first);
