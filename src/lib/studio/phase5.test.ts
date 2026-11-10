import { describe, it, expect } from "vitest";
import {
  isRetryableError,
  validateImageFile,
  validDataUrl,
  freeVisionModel,
  parsePlan,
  needsPlan,
} from "./phase5";
import { TEMPLATES } from "./templates";
import { chatSchema } from "./provider.server";

describe("retries only on connection drops", () => {
  it("retries a dropped stream", () =>
    expect(isRetryableError(new Error("TypeError: error reading a body from connection"))).toBe(
      true,
    ));
  it("retries an interrupted stream", () =>
    expect(isRetryableError(new Error("KI-Verbindung wurde vor Abschluss unterbrochen."))).toBe(
      true,
    ));
  it("does not retry the zero-cost guard", () =>
    expect(isRetryableError(new Error("0€-Schutz: Das Modell ist nicht kostenlos."))).toBe(false));
  it("does not retry a missing key", () =>
    expect(
      isRetryableError(new Error("Bitte zuerst den Anbieter in den Einstellungen verbinden.")),
    ).toBe(false));
  it("does not retry a user stop", () =>
    expect(isRetryableError(new DOMException("Aborted", "AbortError"))).toBe(false));
});

describe("image limits", () => {
  it("accepts a 1 MB PNG", () =>
    expect(validateImageFile({ type: "image/png", size: 1_000_000 }, 0)).toBeNull());
  it("rejects over 2 MB", () =>
    expect(validateImageFile({ type: "image/jpeg", size: 2 * 1024 * 1024 + 1 }, 0)).not.toBeNull());
  it("rejects a fourth image", () =>
    expect(validateImageFile({ type: "image/webp", size: 10 }, 3)).not.toBeNull());
  it("rejects GIF", () =>
    expect(validateImageFile({ type: "image/gif", size: 10 }, 0)).not.toBeNull());
  it("rejects non-image data URLs", () =>
    expect(validDataUrl("data:text/html;base64,PGI+")).toBe(false));
  it("server rejects 4 images", () => {
    const img = { type: "image_url", image_url: { url: "data:image/png;base64,AAAA" } };
    expect(() =>
      chatSchema.parse({
        provider: "openrouter",
        model: "m",
        messages: [{ role: "user", content: [{ type: "text", text: "x" }, img, img, img, img] }],
      }),
    ).toThrow();
  });
});

describe("images only go to free vision models", () => {
  it("skips a paid vision model", () =>
    expect(
      freeVisionModel([{ id: "paid/vl", name: "", free: false, vision: true }]),
    ).toBeUndefined());
  it("skips a free text-only model", () =>
    expect(
      freeVisionModel([
        { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "", free: true, vision: false },
      ]),
    ).toBeUndefined());
  it("picks a free vision model", () =>
    expect(
      freeVisionModel([{ id: "google/gemma-4-31b-it:free", name: "", free: true, vision: true }]),
    ).toBe("google/gemma-4-31b-it:free"));
});

describe("planning", () => {
  it("caps plans at 4 steps", () =>
    expect(parsePlan('["a1","b2","c3","d4","e5"]')).toHaveLength(4));
  it("does not plan short tasks", () => expect(needsPlan("Mach einen Zähler.")).toBe(false));
});

it("ships 5 templates", () => expect(TEMPLATES).toHaveLength(5));
