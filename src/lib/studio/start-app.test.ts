import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ provider: vi.fn(), agent: vi.fn() }));
vi.mock("./provider-client", () => ({ loadProvider: mocks.provider }));
vi.mock("./agent", () => ({ runAgent: mocks.agent }));
import { startApp } from "./start-app";
import { APP_TYPES, appPrompt, starterDraft } from "./app-starters";
import { needsPlan } from "./phase5";
import { useStudio } from "./store";
import { useRuntime } from "./runtime";

beforeEach(() => {
  vi.clearAllMocks();
  useRuntime.setState({ busy: false });
  useStudio.getState().createProject("Existing work", { "/App.tsx": "existing code" });
  useStudio.getState().setSettings({ provider: "openrouter", model: "test-model", mode: "chat", shareProject: false, autoApply: false, autoFix: false, zeroCostOnly: true });
  mocks.provider.mockResolvedValue({ configured: true });
  mocks.agent.mockImplementation(async () => { useRuntime.getState().setBusy(true); });
});

describe("new app launches", () => {
  it("never sends anything or creates a project without explicit consent", async () => {
    const before = useStudio.getState();
    await expect(startApp(starterDraft("shop"), false)).rejects.toThrow();
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.agent).not.toHaveBeenCalled();
    expect(useStudio.getState().projects).toBe(before.projects);
  });
  it("starts the existing agent in a new project and preserves existing files and cost protection", async () => {
    const before = useStudio.getState();
    const draft = { ...starterDraft("shop"), name: "Festival Store", topic: "Festival accessories", style: "light" as const };
    await startApp(draft, true);
    const after = useStudio.getState();
    expect(after.currentId).not.toBe(before.currentId);
    expect(after.projects.find((p) => p.id === before.currentId)?.files).toEqual({ "/App.tsx": "existing code" });
    expect(after.projects.find((p) => p.id === after.currentId)?.name).toBe("Festival Store");
    expect(after.settings).toMatchObject({ mode: "agent", shareProject: true, autoApply: true, autoFix: true, zeroCostOnly: true, model: "test-model" });
    expect(mocks.agent).toHaveBeenCalledExactlyOnceWith(appPrompt(draft));
  });
  it("does not create a project when the provider is disconnected", async () => {
    const before = useStudio.getState().currentId;
    mocks.provider.mockResolvedValue({ configured: false });
    await expect(startApp(starterDraft("website"), true)).rejects.toThrow();
    expect(useStudio.getState().currentId).toBe(before);
    expect(mocks.agent).not.toHaveBeenCalled();
  });
  it("rejects a project switch during provider preflight", async () => {
    mocks.provider.mockImplementation(async () => {
      useStudio.getState().createProject("Other project");
      return { configured: true };
    });
    await expect(startApp(starterDraft("tasks"), true)).rejects.toThrow();
    expect(mocks.agent).not.toHaveBeenCalled();
  });
  it("rejects changed provider settings during preflight", async () => {
    const before = useStudio.getState().currentId;
    mocks.provider.mockImplementation(async () => {
      useStudio.getState().setSettings({ model: "another-model" });
      return { configured: true };
    });
    await expect(startApp(starterDraft("weather"), true)).rejects.toThrow();
    expect(useStudio.getState().currentId).toBe(before);
    expect(mocks.agent).not.toHaveBeenCalled();
  });
  it("does not start a second task while the agent is busy", async () => {
    useRuntime.setState({ busy: true });
    await expect(startApp(starterDraft("shop"), true)).rejects.toThrow();
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.agent).not.toHaveBeenCalled();
  });
  it("blocks blank custom input before creating a project", async () => {
    await expect(startApp({ ...starterDraft("website"), name: " " }, true)).rejects.toThrow();
    expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("runs every bounded category starter in a single generation step", () => {
    for (const type of APP_TYPES) expect(needsPlan(appPrompt(starterDraft(type.id)))).toBe(false);
  });
});