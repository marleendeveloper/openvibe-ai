import { create } from "zustand";

export type LogLine = { level: string; text: string; at: number };

export const useRuntime = create<{
  error: string | null;
  logs: LogLine[];
  busy: boolean;
  setError: (e: string | null) => void;
  setLogs: (l: LogLine[]) => void;
  setBusy: (b: boolean) => void;
}>((set) => ({
  error: null,
  logs: [],
  busy: false,
  setError: (error) => set({ error }),
  setLogs: (logs) => set({ logs }),
  setBusy: (busy) => set({ busy }),
}));
