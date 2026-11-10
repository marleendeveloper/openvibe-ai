import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { parseFileOps } from "./parse";
import { safePath, validateFiles, LIMITS } from "./limits";
import { useStudio, DEFAULT_FILES } from "./store";
import { useRuntime } from "./runtime";
import { repairDecision, filesRevision, waitForPreview } from "./preview-state";
import { streamChat } from "./ai";
import { runAgent, applyMessageOps } from "./agent";
import { providerError } from "./providers";

const generated = '<file path="/App.tsx">import Card from "./Card"; export default function App(){ return <Card />; }</file>\n<file path="/Card.tsx">export default function Card(){ return <h1>Task app</h1>; }</file>\n<delete path="/old.ts" />';
function sse(text: string, ending = "[DONE]") {
  const wire = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\r\n\r\ndata: ${ending}`;
  const bytes = new TextEncoder().encode(wire);
  return new Response(new ReadableStream({ start(controller) { for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7)); controller.close(); } }), { headers: { "content-type": "text/event-stream" } });
}
beforeEach(() => {
  useStudio.getState().createProject("Test", { ...DEFAULT_FILES, "/old.ts": "old" });
  useStudio.getState().setSettings({ provider: "openrouter", model: "test/model", shareProject: true, autoApply: true, autoFix: false, mode: "agent" });
  useRuntime.setState({ busy: false, preview: null, progress: [], error: null });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("project rules", () => {
  it("parses multiple related files and a deletion", () => {
    expect(parseFileOps(generated).map((o) => o.path)).toEqual(["/App.tsx", "/Card.tsx", "/old.ts"]);
  });
  it("rejects traversal and secret paths", () => {
    for (const path of ["/../outside.ts", "C:\\temp\\app.ts", "/.env", "/.git/config", "/node_modules/index.ts"]) expect(() => safePath(path)).toThrow();
  });
  it("does not partially apply a truncated multi-file reply", () => {
    expect(parseFileOps('<file path="/a.ts">ok</file><file path="/b.ts">half')).toEqual([]);
  });
  it("rejects duplicate operations", () => {
    expect(() => parseFileOps('<file path="/a.ts">ok</file><delete path="/a.ts" />')).toThrow();
  });
  it("limits projects to 100 files", () => {
    expect(() => validateFiles(Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`/${i}.ts`, ""])))) .toThrow();
    expect(Object.keys(validateFiles(Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`/${i}.ts`, ""]))))).toHaveLength(100);
  });
  it("applies files atomically, preserves unrelated files and restores all changes", () => {
    const st = useStudio.getState();
    const before = { ...st.projects.find((p) => p.id === st.currentId)?.files };
    st.applyOps(parseFileOps(generated), "build");
    let project = useStudio.getState().projects.find((p) => p.id === st.currentId);
    expect(project?.files["/Card.tsx"]).toContain("Task app");
    expect(project?.files["/old.ts"]).toBeUndefined();
    expect(project?.files["/styles.css"]).toBe(before["/styles.css"]);
    st.undo();
    project = useStudio.getState().projects.find((p) => p.id === st.currentId);
    expect(project?.files).toEqual(before);
  });
  it("never applies message patches to another project", () => {
    const st = useStudio.getState();
    const original = st.currentId;
    st.addMessage({ id: "patch", role: "assistant", content: "", ops: parseFileOps(generated), opsStatus: "pending" });
    st.createProject("Other");
    const other = useStudio.getState().currentId;
    applyMessageOps("patch", original);
    expect(useStudio.getState().projects.find((p) => p.id === other)?.files["/Card.tsx"]).toBeUndefined();
    expect(useStudio.getState().projects.find((p) => p.id === original)?.files["/Card.tsx"]).toBeDefined();
  });
  it("rejects patches after concurrent file edits", () => {
    const st = useStudio.getState();
    const files = st.projects.find((p) => p.id === st.currentId)?.files ?? {};
    st.addMessage({ id: "stale", role: "assistant", content: "", ops: parseFileOps(generated), opsStatus: "pending", baseFiles: { ...files } });
    st.writeFile("/App.tsx", "manual edit");
    expect(() => applyMessageOps("stale")).toThrow();
  });
  it("removes old API keys during persistence migration", () => {
    const migrate = useStudio.persist.getOptions().migrate;
    const old = migrate?.({ settings: { keys: { openrouter: "not-a-real-key" }, model: "m" } }, 1) as { settings: Record<string, unknown> };
    expect(old.settings["keys"]).toBeUndefined();
  });
});

describe("streaming and agent", () => {
  it("handles split UTF-8 events, CRLF and final event without newline", async () => {
    const fetch = vi.fn().mockResolvedValue(sse("Grüße 🌱"));
    vi.stubGlobal("fetch", fetch);
    let output = "";
    expect(await streamChat({ provider: "openrouter", model: "m", messages: [], onToken: (t) => { output += t; } })).toBe("Grüße 🌱");
    expect(output).toBe("Grüße 🌱");
    const headers = fetch.mock.calls[0]?.[1].headers;
    expect(headers.authorization).toBeUndefined();
  });
  it("rejects incomplete streams", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sse("partial", "")));
    await expect(streamChat({ provider: "openrouter", model: "m", messages: [], onToken: () => {} })).rejects.toThrow("unterbrochen");
  });
  it("rejects token-limit truncation before applying files", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sse("partial", JSON.stringify({ choices: [{ finish_reason: "length" }] }))));
    await expect(streamChat({ provider: "openrouter", model: "m", messages: [], onToken: () => {} })).rejects.toThrow("Tokenlimit");
  });
  it("generates, applies and deletes files through a mock provider", async () => {
    const fetch = vi.fn().mockImplementation((url) => Promise.resolve(String(url).includes("/provider?") ? Response.json({ configured: true, models: [] }) : sse(generated)));
    vi.stubGlobal("fetch", fetch);
    await runAgent("Create a task app");
    const st = useStudio.getState();
    const p = st.projects.find((p) => p.id === st.currentId);
    expect(p?.files["/Card.tsx"]).toContain("Task app");
    expect(p?.files["/old.ts"]).toBeUndefined();
    expect(p?.history).toHaveLength(1);
    expect(useRuntime.getState().busy).toBe(false);
  });
  it("requires explicit consent before sending project files", async () => {
    useStudio.getState().setSettings({ shareProject: false });
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await runAgent("Create an app");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("handles reasoning deltas separately from content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('data: {"choices":[{"delta":{"reasoning_content":"plan"}}]}\n\ndata: {"choices":[{"delta":{"content":"answer"}}]}\n\ndata: [DONE]\n\n', { headers: { "content-type": "text/event-stream" } })));
    let output = "";
    expect(await streamChat({ provider: "openrouter", model: "m", messages: [], onToken: (t) => { output += t; } })).toBe("answer");
    expect(output).toBe("<think>plan</think>answer");
  });
});

describe("repair rules", () => {
  it("allows exactly five repair attempts", () => {
    const seen = new Set<string>();
    expect(LIMITS.repairs).toBe(5);
    for (let i = 0; i < 5; i++) expect(repairDecision(i, `error ${i}`, seen)).toBe("repair");
    expect(repairDecision(5, "sixth error", seen)).toBe("limit");
  });
  it("stops on an identical error", () => {
    const seen = new Set<string>();
    expect(repairDecision(0, "same error", seen)).toBe("repair");
    expect(repairDecision(1, " same   error ", seen)).toBe("repeat");
  });
  it("does not accept a preview from a different revision", async () => {
    vi.useFakeTimers();
    useRuntime.getState().setPreview({ projectId: "p", revision: "old", status: "ready", error: null });
    const pending = waitForPreview("p", "new", new AbortController().signal, 1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual({ error: null, verified: false });
    expect(filesRevision({ "/a.ts": "a" })).not.toBe(filesRevision({ "/a.ts": "b" }));
  });
  it("auto-repairs after a matching preview error", async () => {
    vi.useFakeTimers();
    useStudio.getState().setSettings({ autoFix: true });
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => {
      if (String(url).includes("/provider?")) return Promise.resolve(Response.json({ configured: true, models: [] }));
      calls++;
      return Promise.resolve(sse(calls === 1 ? '<file path="/App.tsx">broken</file>' : '<file path="/App.tsx">fixed</file>'));
    }));
    const pending = runAgent("Fix app");
    await vi.advanceTimersByTimeAsync(100);
    let st = useStudio.getState();
    let p = st.projects.find((p) => p.id === st.currentId);
    useRuntime.getState().setPreview({ projectId: st.currentId, revision: filesRevision(p?.files ?? {}), status: "error", error: "compile failed" });
    await vi.advanceTimersByTimeAsync(400);
    st = useStudio.getState(); p = st.projects.find((p) => p.id === st.currentId);
    useRuntime.getState().setPreview({ projectId: st.currentId, revision: filesRevision(p?.files ?? {}), status: "ready", error: null });
    await vi.advanceTimersByTimeAsync(2600);
    await pending;
    expect(calls).toBe(2);
    expect(p?.files["/App.tsx"]).toBe("fixed\n");
  });
});

describe("provider diagnosis", () => {
  for (const code of [401, 402, 403, 429, 500, 503]) it(`preserves provider status ${code} and detail`, () => {
    expect(providerError(code, "specific failure")).toContain(`HTTP ${code}`);
    expect(providerError(code, "specific failure")).toContain("specific failure");
  });
});