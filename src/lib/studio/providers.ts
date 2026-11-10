export type ProviderId = "huggingface" | "openrouter" | "custom";

export const PROVIDERS: Record<ProviderId, { name: string; baseUrl: string; keyHint: string }> = {
  huggingface: { name: "Hugging Face", baseUrl: "https://router.huggingface.co/v1", keyHint: "hf_…" },
  openrouter: { name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", keyHint: "sk-or-…" },
  custom: { name: "OpenAI-kompatibel", baseUrl: "", keyHint: "API-Key" },
};

export const SUGGESTED_MODELS: Record<ProviderId, string[]> = {
  huggingface: [
    "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    "Qwen/Qwen3-Coder-30B-A3B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "deepseek-ai/DeepSeek-V3-0324",
    "deepseek-ai/DeepSeek-R1",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "moonshotai/Kimi-K2-Instruct",
  ],
  openrouter: [
    "qwen/qwen3-coder:free",
    "deepseek/deepseek-r1:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "openai/gpt-oss-120b",
  ],
  custom: [],
};

/** Hosts the server proxy forwards to (avoids browser CORS limits). */
export const PROXY_HOSTS = ["router.huggingface.co", "openrouter.ai"];
