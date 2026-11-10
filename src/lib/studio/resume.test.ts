import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
let failAt: number | null = null;
let noOpsAt: number | null = null;
vi.mock("./provider-client", () => ({ loadProvider: async () => ({ configured: true }) }));
vi.mock("./ai", () => ({
  streamChat: async (o: {
    messages: { role: string; content: unknown }[];
    onToken: (t: string) => void;
  }) => {
    const last = String(o.messages.at(-1)!.content);
    if (String(o.messages[0]!.content).startsWith("Split")) {
      o.onToken('["A","B","C","D"]');
      return "";
    }
    const n = Number(last.match(/step (\d) of 4/)?.[1] ?? 0);
    calls.push(n ? `S${n}` : "single");
    if (n === failAt) throw new Error("Tokenlimit erreicht");
    if (n === noOpsAt) {
      o.onToken(n ? "Schritt ist bereits erledigt." : "");
      return "";
    }
    const text = `<file path="/S${n}.tsx">export const s${n} = ${n};</file>`;
    o.onToken(text);
    return text;
  },
}));

import { useStudio, DEFAULT_FILES } from "./store";
import { useRuntime } from "./runtime";
import { runAgent, checkResume } from "./agent";
import { filesRevision } from "./preview-state";

const BIG =
  "Baue eine App mit Kopfzeile, Liste, Filter, Suche, Fußzeile, Einstellungen und Statistik.";
const cur = () =>
  useStudio.getState().projects.find((p) => p.id === useStudio.getState().currentId)!;
const lastResume = () => [...cur().messages].reverse().find((m) => m.error)?.resume;

beforeEach(() => {
  calls.length = 0;
  failAt = null;
  noOpsAt = null;
  useStudio.getState().createProject("Resume", { ...DEFAULT_FILES });
  useStudio.getState().setSettings({
    provider: "openrouter",
    model: "t/m",
    shareProject: true,
    autoApply: true,
    autoFix: false,
    mode: "agent",
  });
  useRuntime.setState({ busy: false, preview: null, progress: [] });
});

describe("resume failed plan steps", () => {
  it("failure in step 3 resumes with only steps 3 and 4; steps 1-2 stay", async () => {
    failAt = 3;
    await runAgent(BIG);
    expect(calls).toEqual(["S1", "S2", "S3"]);
    const r = lastResume()!;
    expect(r.failedStep).toBe(2);
    expect(r.steps).toEqual(["A", "B", "C", "D"]);
    failAt = null;
    calls.length = 0;
    const userMsgs = cur().messages.filter((m) => m.role === "user").length;
    await runAgent(r.prompt, [], undefined, r);
    expect(calls).toEqual(["S3", "S4"]);
    expect(Object.keys(cur().files)).toEqual(
      expect.arrayContaining(["/S1.tsx", "/S2.tsx", "/S3.tsx", "/S4.tsx"]),
    );
    expect(cur().messages.filter((m) => m.role === "user").length).toBe(userMsgs);
  });

  it("a second failure during resume stores a new resume point", async () => {
    failAt = 3;
    await runAgent(BIG);
    failAt = 4;
    calls.length = 0;
    await runAgent(BIG, [], undefined, lastResume()!);
    expect(calls).toEqual(["S3", "S4"]);
    expect(lastResume()!.failedStep).toBe(3);
    failAt = null;
    calls.length = 0;
    await runAgent(BIG, [], undefined, lastResume()!);
    expect(calls).toEqual(["S4"]);
  });

  it("refuses to resume after files changed (stale revision)", async () => {
    failAt = 3;
    await runAgent(BIG);
    const r = lastResume()!;
    useStudio.getState().writeFile("/S1.tsx", "changed");
    calls.length = 0;
    failAt = null;
    await runAgent(BIG, [], undefined, r);
    expect(calls).toEqual([]);
    expect(cur().messages.at(-1)!.error).toMatch(/verändert/);
  });

  it("refuses to resume in another project", async () => {
    failAt = 3;
    await runAgent(BIG);
    const r = lastResume()!;
    useStudio.getState().createProject("Other", { ...DEFAULT_FILES });
    calls.length = 0;
    failAt = null;
    await runAgent(BIG, [], undefined, r);
    expect(calls).toEqual([]);
    expect(cur().messages.at(-1)!.error).toMatch(/anderen Projekt/);
    expect(checkResume(r, r.projectId, { x: "1" })).toMatch(/verändert/);
  });

  it("normal single task runs once without a resume point", async () => {
    await runAgent("Ändere den Titel.");
    expect(calls).toEqual(["single"]);
    failAt = 0;
    calls.length = 0;
    await runAgent("Ändere den Titel nochmal.");
    expect(lastResume()).toBeUndefined();
    expect(filesRevision(cur().files)).toBeTruthy();
  });

  it("a plan step the model reports as already done continues without file changes", async () => {
    noOpsAt = 2;
    await runAgent(BIG);
    expect(calls).toEqual(["S1", "S2", "S3", "S4"]);
    expect(lastResume()).toBeUndefined();
    expect(cur().files["/S2.tsx"]).toBeUndefined();
    expect(useRuntime.getState().progress).toContain(
      "Schritt 2/4: Keine Dateiänderungen nötig (laut Modell)",
    );
  });

  it("a single-step task with no file changes still fails clearly", async () => {
    noOpsAt = 0;
    await runAgent("Kleine Änderung");
    expect(calls).toEqual(["single"]);
    expect([...cur().messages].reverse().find((m) => m.error)?.error).toMatch(
      /Keine vollständigen Dateiänderungen/,
    );
  });
});
