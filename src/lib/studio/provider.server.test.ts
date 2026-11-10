import { describe, it, expect, vi, afterEach } from "vitest";
import { webcrypto } from "node:crypto";

const cookies = vi.hoisted(() => ({ value: "", options: {} as Record<string, unknown> }));
vi.mock("@tanstack/react-start/server", () => ({
  getCookie: () => cookies.value,
  setCookie: (_name: string, value: string, options: Record<string, unknown>) => { cookies.value = value; cookies.options = options; },
  deleteCookie: () => { cookies.value = ""; },
}));
import { chatSchema, assertSameOrigin, readBoundedBody, saveCredential, readCredential, removeCredential, baseUrl } from "./provider.server";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); cookies.value = ""; });

describe("server provider security", () => {
  it("requires a same-origin request before mutating credentials or invoking AI", () => {
    expect(() => assertSameOrigin(new Request("https://studio.example/api/public/ai", { headers: { origin: "https://evil.example" } }))).toThrow();
    expect(() => assertSameOrigin(new Request("https://studio.example/api/public/ai"))).toThrow();
    expect(() => assertSameOrigin(new Request("https://studio.example/api/public/ai", { headers: { origin: "https://studio.example" } }))).not.toThrow();
  });
  it("encrypts credentials in HttpOnly Secure SameSite cookies and separates providers", async () => {
    vi.stubGlobal("crypto", webcrypto);
    vi.stubEnv("OPENVIBE_CREDENTIAL_SECRET", "test-only-encryption-key-not-used-by-app");
    await saveCredential("openrouter", "test-only-provider-key", new Request("https://studio.example/api/public/provider"));
    expect(cookies.value).not.toContain("test-only-provider-key");
    expect(cookies.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "strict", path: "/api/public/", maxAge: 2592000 });
    expect(await readCredential("openrouter")).toBe("test-only-provider-key");
    expect(await readCredential("huggingface")).toBeNull();
    cookies.value += "invalid";
    expect(await readCredential("openrouter")).toBeNull();
    removeCredential("openrouter");
    expect(cookies.value).toBe("");
  });
  it("validates providers, model and token limits and rejects browser-supplied keys", () => {
    const valid = { provider: "openrouter", model: "m", messages: [{ role: "user", content: "hi" }] };
    expect(chatSchema.parse(valid).max_tokens).toBe(8192);
    expect(() => chatSchema.parse({ ...valid, max_tokens: 32769 })).toThrow();
    expect(() => chatSchema.parse({ ...valid, apiKey: "forbidden" })).toThrow();
    expect(() => chatSchema.parse({ ...valid, provider: "unknown" })).toThrow();
  });
  it("bounds incoming request bytes even without content-length", async () => {
    await expect(readBoundedBody(new Request("https://studio.example/api/public/ai", { method: "POST", body: "x".repeat(1_500_001) }))).rejects.toThrow("size");
  });
  it("never accepts a client-controlled custom network target", () => {
    vi.stubEnv("OPENVIBE_CUSTOM_BASE_URL", "http://localhost:3000");
    expect(() => baseUrl("custom")).toThrow();
    expect(baseUrl("openrouter")).toBe("https://openrouter.ai/api/v1");
  });
});