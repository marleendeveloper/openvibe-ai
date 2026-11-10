import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { LIMITS, byteSize } from "./limits";
import { PROVIDERS, providerError, type ProviderId, type ModelInfo } from "./providers";

export const providerSchema = z.enum(["openrouter", "huggingface", "custom"]);
export const chatSchema = z.object({
  provider: providerSchema,
  model: z.string().min(1).max(200),
  messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().max(LIMITS.projectBytes) })).min(1).max(LIMITS.messages),
  temperature: z.number().min(0).max(1.5).default(0.4),
  max_tokens: z.number().int().min(128).max(LIMITS.maxTokens).default(8192),
  stream: z.boolean().default(true),
}).strict();

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(request.url).origin;
  if (!origin || origin !== expected) throw new Error("origin");
}

export async function readBoundedBody(request: Request) {
  if (Number(request.headers.get("content-length")) > LIMITS.requestBytes) throw new Error("size");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > LIMITS.requestBytes) { await reader.cancel(); throw new Error("size"); }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(all));
}

async function encryptionKey() {
  const secret = process.env["OPENVIBE_CREDENTIAL_SECRET"];
  if (!secret) throw new Error("Sichere Schlüsselspeicherung ist noch nicht konfiguriert.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
const encode = (data: Uint8Array) => btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decode = (text: string) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const cookieName = (provider: ProviderId) => `openvibe-key-${provider}`;
export async function saveCredential(provider: ProviderId, key: string, request: Request) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(provider) }, await encryptionKey(), new TextEncoder().encode(JSON.stringify({ key, expires: Date.now() + 30 * 86400000 }))));
  setCookie(cookieName(provider), `${encode(iv)}.${encode(ciphertext)}`, { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "strict", path: "/api/public/", maxAge: 30 * 86400 });
}
export function removeCredential(provider: ProviderId) { deleteCookie(cookieName(provider), { path: "/api/public/" }); }
export async function readCredential(provider: ProviderId): Promise<string | null> {
  try {
    const value = getCookie(cookieName(provider));
    if (!value) return null;
    const [iv, ciphertext] = value.split(".");
    if (!iv || !ciphertext) return null;
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(iv), additionalData: new TextEncoder().encode(provider) }, await encryptionKey(), decode(ciphertext));
    const payload = JSON.parse(new TextDecoder().decode(plain));
    return payload.expires > Date.now() && typeof payload.key === "string" ? payload.key : null;
  } catch { return null; }
}

export function baseUrl(provider: ProviderId) {
  if (provider !== "custom") return PROVIDERS[provider].baseUrl;
  // A builder-controlled endpoint, never an arbitrary browser-supplied proxy target.
  const configured = process.env["OPENVIBE_CUSTOM_BASE_URL"] ?? "";
  if (!configured) return "";
  const url = new URL(configured);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || (url.port && url.port !== "443")) throw new Error("Ungültiger eigener Anbieter-Endpunkt.");
  return configured.replace(/\/+$/, "");
}

export async function providerFetch(provider: ProviderId, key: string, path: string, init: RequestInit = {}) {
  const base = baseUrl(provider);
  if (!base) throw new Error("Der eigene Anbieter benötigt eine serverseitig konfigurierte OPENVIBE_CUSTOM_BASE_URL.");
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${key}`);
  const response = await fetch(`${base}${path}`, { ...init, headers, redirect: "error", signal: init.signal ?? AbortSignal.timeout(120000) });
  if (!response.ok) {
    const detail = (await response.text()).replaceAll(key, "[entfernt]");
    console.error(`External provider ${provider} [${response.status}]: ${detail.slice(0, 2000)}`);
    return new Response(JSON.stringify({ error: providerError(response.status, detail, response.headers.get("retry-after")) }), { status: response.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  return response;
}

export async function modelCatalog(provider: ProviderId, key: string | null): Promise<ModelInfo[]> {
  if (!key && provider !== "openrouter") return [];
  const response = await providerFetch(provider, key ?? "", "/models");
  if (!response.ok) throw new Error((await response.json()).error);
  const raw = await response.text();
  if (byteSize(raw) > 10_000_000) throw new Error("Modellkatalog zu groß.");
  const data = JSON.parse(raw).data;
  if (!Array.isArray(data)) throw new Error("Anbieter liefert keinen gültigen Modellkatalog.");
  return data.filter((m) => typeof m.id === "string").map((m) => ({ id: m.id, name: m.name ?? m.id, context: m.context_length, free: provider === "openrouter" && m.pricing?.prompt !== undefined && m.pricing?.completion !== undefined && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0 }));
}

export function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Anfrage fehlgeschlagen.";
  const status = message === "origin" ? 403 : message === "size" ? 413 : error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 502;
  return Response.json({ error: message === "origin" ? "Nur Anfragen von diesem Studio erlaubt." : message === "size" ? "Anfrage ist zu groß." : message }, { status, headers: { "cache-control": "no-store" } });
}