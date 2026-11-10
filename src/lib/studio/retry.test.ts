import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./provider-client", () => ({ loadProvider: async () => ({ configured: true }), ownerHeaders: async () => ({}) }));

import { useStudio, DEFAULT_FILES } from "./store";
import { useRuntime } from "./runtime";
import { runAgent, stopAgent } from "./agent";

const enc = new TextEncoder();
const ev = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
const FULL = '<file path="/App.tsx">export default function App(){ return <h1>Neu</h1>; }</file>';
const PARTIAL = '<file path="/Half.tsx">export const half = 1;</file>\n<file path="/App.tsx">export default function App(){ return <h1>Te';

/** First chunk delivered, then the connection drops like a real network failure. */
const dropping = () => new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(ev(PARTIAL))); setTimeout(() => c.error(new TypeError("network error")), 5); } }), { headers: { "content-type": "text/event-stream" } });
const complete = () => new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(ev(FULL) + "data: [DONE]\n\n")); c.close(); } }), { headers: { "content-type": "text/event-stream" } });

const cur = () => useStudio.getState().projects.find((p) => p.id === useStudio.getState().currentId)!;
let snapshotsBefore = 0;
let bodies: string[] = [];

beforeEach(() => {
  bodies = [];
  useStudio.getState().createProject("Retry", { ...DEFAULT_FILES });
  useStudio.getState().setSettings({ provider: "openrouter", model: "t/m", shareProject: true, autoApply: true, autoFix: false, mode: "agent" });
  useRuntime.setState({ busy: false, preview: null, progress: [] });
  snapshotsBefore = cur().history.length;
});
afterEach(() => vi.unstubAllGlobals());

const stub = (responses: (() => Response)[]) => {
  let i = 0;
  vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => { bodies.push(String(init.body)); return responses[Math.min(i++, responses.length - 1)]!(); }));
};

describe("stream retry with a dropping mock stream", () => {
  it("discards the partial first attempt and applies exactly one complete change", async () => {
    stub([dropping, complete]);
    await runAgent("Ändere den Titel.");
    const progress = useRuntime.getState().progress;
    expect(progress.some((p) => p.includes("Neuer Versuch 1/2"))).toBe(true);
    expect(progress.some((p) => p.includes("Neuer Versuch 2/2"))).toBe(false);
    expect(bodies).toHaveLength(2);
    expect(cur().files["/Half.tsx"]).toBeUndefined();
    expect(cur().files["/App.tsx"]).toContain("<h1>Neu</h1>");
    expect(cur().history.length).toBe(snapshotsBefore + 1);
    const last = cur().messages.at(-1)!;
    expect(last.content).toBe(FULL);
    expect(last.ops).toHaveLength(1);
    expect(last.opsStatus).toBe("applied");
    expect(last.error).toBeUndefined();
  });

  it("fails clearly after two failed retries and applies nothing", async () => {
    stub([dropping]);
    const before = { ...cur().files };
    await runAgent("Ändere den Titel.");
    expect(bodies).toHaveLength(3);
    expect(useRuntime.getState().progress.filter((p) => p.includes("Neuer Versuch"))).toHaveLength(2);
    expect(cur().files).toEqual(before);
    expect(cur().history.length).toBe(snapshotsBefore);
    const last = cur().messages.at(-1)!;
    expect(last.error).toMatch(/network error/);
    expect(last.ops).toBeUndefined();
  }, 15000);

  it("does not retry a manual stop", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => {
      bodies.push("x");
      return new Response(new ReadableStream({ start(c) {
        c.enqueue(enc.encode(ev(PARTIAL)));
        init.signal?.addEventListener("abort", () => c.error(new DOMException("Aborted", "AbortError")));
      } }), { headers: { "content-type": "text/event-stream" } });
    }));
    const run = runAgent("Ändere den Titel.");
    await new Promise((r) => setTimeout(r, 30));
    stopAgent();
    await run;
    expect(bodies).toHaveLength(1);
    expect(useRuntime.getState().progress.some((p) => p.includes("Neuer Versuch"))).toBe(false);
    expect(cur().messages.at(-1)!.error).toBe("Abgebrochen.");
    expect(cur().files["/Half.tsx"]).toBeUndefined();
  });

  it("never resends a failed partial reply as context on the next request", async () => {
    stub([dropping]);
    await runAgent("Ändere den Titel.");
    bodies = [];
    stub([complete]);
    await runAgent("Ändere den Titel.");
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).not.toContain("Half.tsx");
  }, 15000);
});
