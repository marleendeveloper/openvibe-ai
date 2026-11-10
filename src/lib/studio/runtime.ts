import { create } from "zustand";
import type { ProviderId } from "./providers";

export type LogLine = { level: string; text: string; at: number };

export const useRuntime = create<{
  error: string | null;
  logs: LogLine[];
  busy: boolean;
  progress: string[];
  phase: "plan" | "write" | "check" | "done" | null;
  setPhase: (p: "plan" | "write" | "check" | "done" | null) => void;
  connected: Partial<Record<ProviderId, boolean>>;
  preview: {
    projectId: string;
    revision: string;
    status: "loading" | "ready" | "error";
    error: string | null;
  } | null;
  setPreview: (value: {
    projectId: string;
    revision: string;
    status: "loading" | "ready" | "error";
    error: string | null;
  }) => void;
  setConnected: (p: ProviderId, value: boolean) => void;
  step: (text: string) => void;
  resetProgress: () => void;
  setError: (e: string | null) => void;
  setLogs: (l: LogLine[]) => void;
  setBusy: (b: boolean) => void;
}>((set) => ({
  error: null,
  logs: [],
  busy: false,
  progress: [],
  phase: null,
  setPhase: (phase) => set({ phase }),
  connected: {},
  preview: null,
  setPreview: (preview) => set({ preview, error: preview.error }),
  setConnected: (p, value) => set((s) => ({ connected: { ...s.connected, [p]: value } })),
  step: (text) => set((s) => ({ progress: [...s.progress, text].slice(-30) })),
  resetProgress: () => set({ progress: [], phase: null }),
  setError: (error) => set({ error }),
  setLogs: (logs) => set({ logs }),
  setBusy: (busy) => set({ busy }),
}));
