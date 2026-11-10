import type { ProviderId, ProviderStatus } from "./providers";

export async function loadProvider(provider: ProviderId): Promise<ProviderStatus> {
  const response = await fetch(`/api/public/provider?provider=${provider}`, { credentials: "same-origin" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Verbindung konnte nicht geladen werden.");
  return data;
}

export async function configureProvider(provider: ProviderId, action: "save" | "remove" | "test", extra: { key?: string; model?: string } = {}) {
  const response = await fetch("/api/public/provider", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider, action, ...extra }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
  return data;
}