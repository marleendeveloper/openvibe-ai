import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ stream: vi.fn(), provider: vi.fn() }));
vi.mock("./ai", () => ({ streamChat: mocks.stream }));
vi.mock("./provider-client", () => ({ loadProvider: mocks.provider }));
import { answerCreationQuestions, runAgent } from "./agent";
import { creationQuestions, completionBody } from "./creation";
import { APP_TYPES, appPrompt, starterDraft } from "./app-starters";
import { DEFAULT_FILES, useStudio } from "./store";
import { useRuntime } from "./runtime";

const complete =
  '<file path="/App.tsx">export default function App(){return <h1>Fotostudio</h1>}</file>';
const current = () => {
  const s = useStudio.getState();
  const p = s.projects.find((p) => p.id === s.currentId);
  if (!p) throw new Error("Missing test project");
  return p;
};
beforeEach(() => {
  vi.clearAllMocks();
  useRuntime.setState({ busy: false, clarification: null, progress: [], preview: null });
  useStudio.getState().createProject("Questions", { ...DEFAULT_FILES });
  useStudio.getState().setSettings({
    provider: "openrouter",
    model: "test",
    mode: "agent",
    shareProject: true,
    autoApply: true,
    autoFix: false,
  });
  mocks.provider.mockResolvedValue({ configured: true });
  mocks.stream.mockImplementation(async (opts: { onToken: (t: string) => void }) => {
    opts.onToken(complete);
    return complete;
  });
});

describe("relevant choices before coding", () => {
  it("asks for an unspecified purpose before sending anything or editing files", async () => {
    await runAgent("Erstelle eine Website");
    expect(useRuntime.getState().clarification?.questions.map((q) => q.id)).toEqual(["purpose"]);
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.stream).not.toHaveBeenCalled();
    expect(current().files).toEqual(DEFAULT_FILES);
    expect(current().history).toHaveLength(0);
    expect(useRuntime.getState().busy).toBe(false);
  });
  it("starts only after an answer and includes the confirmed purpose", async () => {
    await runAgent("Erstelle eine Website");
    await answerCreationQuestions({ purpose: "Für mein Fotostudio mit Galerie" });
    expect(useRuntime.getState().clarification).toBeNull();
    expect(mocks.stream).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(mocks.stream.mock.calls[0])).toContain("Für mein Fotostudio mit Galerie");
    expect(current().files["/App.tsx"]).toContain("Fotostudio");
    expect(current().history).toHaveLength(1);
    expect(useRuntime.getState().progress).toContain("Schreibe /App.tsx");
  });
  it("keeps the question pending when an answer is missing", async () => {
    await runAgent("Erstelle eine Website");
    await expect(answerCreationQuestions({ purpose: " " })).rejects.toThrow("Rückfrage");
    expect(useRuntime.getState().clarification).not.toBeNull();
    expect(mocks.stream).not.toHaveBeenCalled();
  });
  it("rejects stale answers after file edits", async () => {
    await runAgent("Erstelle eine Website");
    useStudio.getState().writeFile("/App.tsx", "concurrent edit");
    await expect(answerCreationQuestions({ purpose: "Fotostudio" })).rejects.toThrow("geändert");
    expect(mocks.stream).not.toHaveBeenCalled();
    expect(current().files["/App.tsx"]).toBe("concurrent edit");
  });
  it("rejects answers in another project", async () => {
    await runAgent("Erstelle eine Website");
    useStudio.getState().createProject("Another");
    await expect(answerCreationQuestions({ purpose: "Fotostudio" })).rejects.toThrow("geändert");
    expect(mocks.stream).not.toHaveBeenCalled();
  });
  it("rejects answers after a model change", async () => {
    await runAgent("Erstelle eine Website");
    useStudio.getState().setSettings({ model: "other" });
    await expect(answerCreationQuestions({ purpose: "Fotostudio" })).rejects.toThrow("geändert");
    expect(mocks.stream).not.toHaveBeenCalled();
  });
  it("asks before payments, accounts and replacing all work", () => {
    expect(
      creationQuestions("Baue einen Shop mit Stripe und Login. Ersetze das gesamte Projekt.").map(
        (q) => q.id,
      ),
    ).toEqual(["payments", "accounts", "replacement"]);
  });
  it("does not interrupt well-defined local starters or minor implementation choices", () => {
    for (const type of APP_TYPES)
      expect(creationQuestions(appPrompt(starterDraft(type.id)))).toEqual([]);
    expect(
      creationQuestions(
        "Baue eine Aufgaben-App mit Filtern und lokaler Speicherung, ohne Anmeldung.",
      ),
    ).toEqual([]);
  });
});

describe("direct code output", () => {
  const data = {
    model: "test",
    messages: [{ role: "user" as const, content: "Build a task app" }],
    stream: true,
    temperature: 0.4,
    max_tokens: 16384,
  };
  it("disables lengthy provider reasoning for OpenRouter and preserves the complete code budget", () => {
    expect(completionBody({ ...data, provider: "openrouter" })).toEqual({
      ...data,
      reasoning: { enabled: false, exclude: true },
    });
  });
  it("does not send OpenRouter-specific reasoning options to other providers", () => {
    expect(completionBody({ ...data, provider: "huggingface" })).toEqual(data);
    expect(completionBody({ ...data, provider: "custom" })).toEqual(data);
  });
});
