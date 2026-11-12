import { describe, expect, it } from "vitest";
import { isOverloadError, overloadFallbacks } from "./phase5";

describe("overload fallback", () => {
  it("detects an overloaded provider (HTTP 503)", () => {
    expect(isOverloadError(new Error("HTTP 503: Der Anbieter ist derzeit nicht erreichbar."))).toBe(true);
    expect(isOverloadError(new Error("HTTP 401: Ungültiger Schlüssel"))).toBe(false);
  });
  it("only offers other free models while the 0€ guard is on", () => {
    const list = overloadFallbacks("nvidia/nemotron-3-ultra-550b-a55b:free", true);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((m) => m.endsWith(":free"))).toBe(true);
    expect(overloadFallbacks("nvidia/nemotron-3-ultra-550b-a55b:free", false)).toEqual([]);
    expect(overloadFallbacks("openai/gpt-5", true)).toEqual([]);
  });
});

import { needsPlan } from "./phase5";
import { EXAMPLE_PROMPTS } from "./templates";
describe("live demo prompts", () => {
  it("are built in one step, without a plan", () => {
    for (const p of EXAMPLE_PROMPTS) expect(needsPlan(p)).toBe(false);
  });
});
