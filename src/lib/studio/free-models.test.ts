import { afterEach, describe, expect, it, vi } from "vitest";
import { hasZeroPricing, recommendedFreeModel } from "./providers";
import { assertZeroCostModel } from "./provider.server";

afterEach(() => vi.unstubAllGlobals());

describe("zero-euro coding", () => {
  it("selects the coding preference only when currently free", () => {
    expect(recommendedFreeModel([{ id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Ultra", free: true }])).toBe("nvidia/nemotron-3-ultra-550b-a55b:free");
    expect(recommendedFreeModel([{ id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Ultra", free: false }])).toBeUndefined();
  });
  it("rejects any nonzero price even when input and output cost zero", () => {
    expect(hasZeroPricing({ prompt: "0", completion: "0", request: "0.01" })).toBe(false);
    expect(hasZeroPricing({ prompt: "0", completion: "0", request: "0" })).toBe(true);
    expect(hasZeroPricing({ prompt: "0" })).toBe(false);
  });
  it("blocks a paid model before invoking completions", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ data: [{ id: "paid:free", pricing: { prompt: "1", completion: "0" } }] }));
    vi.stubGlobal("fetch", fetch);
    await expect(assertZeroCostModel("openrouter", "paid:free", true)).rejects.toThrow("0€-Schutz");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe("https://openrouter.ai/api/v1/models");
  });
  it("permits a model with verified complete zero pricing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [{ id: "free", pricing: { prompt: "0", completion: "0" } }] })));
    await expect(assertZeroCostModel("openrouter", "free", true)).resolves.toBeUndefined();
  });
  it("blocks unverified provider pricing while the guard is enabled", async () => {
    await expect(assertZeroCostModel("huggingface", "m", true)).rejects.toThrow("0€-Schutz");
    await expect(assertZeroCostModel("huggingface", "m", false)).resolves.toBeUndefined();
  });
});