import { beforeEach, expect, it, vi } from "vitest";
vi.mock("./provider-client", () => ({ loadProvider: async () => ({ configured: true }) }));
const stream = vi.hoisted(() => vi.fn());
vi.mock("./ai", () => ({ streamChat: stream }));
import { runAgent } from "./agent";
import { useStudio, DEFAULT_FILES } from "./store";
import { useRuntime } from "./runtime";

const duplicate =
  '<file path="/styles.css">a{color:red}</file><file path="/styles.css">a{color:blue}</file>';
const complete =
  '<file path="/App.tsx">export default function App(){return <h1>Ready</h1>}</file>';
const current = () => {
  const s = useStudio.getState();
  const p = s.projects.find((p) => p.id === s.currentId);
  if (!p) throw new Error("Missing test project");
  return p;
};
beforeEach(() => {
  stream.mockReset();
  useStudio.getState().createProject("Output repair", { ...DEFAULT_FILES });
  useStudio
    .getState()
    .setSettings({
      provider: "openrouter",
      model: "test",
      mode: "agent",
      shareProject: true,
      autoApply: true,
      autoFix: true,
    });
  useRuntime.setState({ busy: false, preview: null, progress: [] });
  stream.mockImplementation(async (opts: { onToken: (t: string) => void }) => {
    const text = stream.mock.calls.length === 1 ? duplicate : complete;
    opts.onToken(text);
    return text;
  });
});
it("repairs a duplicate-file response without applying either ambiguous variant", async () => {
  // Preview checking is separate from output validation.
  const preview = await import("./preview-state");
  const wait = vi
    .spyOn(preview, "waitForPreview")
    .mockResolvedValue({ verified: true, error: null });
  await runAgent("Erstelle eine Website.");
  expect(stream).toHaveBeenCalledTimes(2);
  expect(current().files["/styles.css"]).toBe(DEFAULT_FILES["/styles.css"]);
  expect(current().files["/App.tsx"]).toContain("Ready");
  expect(current().history).toHaveLength(1);
  expect(current().messages.at(-1)?.opsStatus).toBe("applied");
  wait.mockRestore();
});
it("stops on a repeated duplicate error and leaves files and snapshots unchanged", async () => {
  stream.mockImplementation(async (opts: { onToken: (t: string) => void }) => {
    opts.onToken(duplicate);
    return duplicate;
  });
  await runAgent("Erstelle eine Website.");
  expect(stream).toHaveBeenCalledTimes(2);
  expect(current().files).toEqual(DEFAULT_FILES);
  expect(current().history).toHaveLength(0);
  expect(current().messages.at(-1)?.error).toBe("Mehrdeutige Änderungen für /styles.css.");
});
