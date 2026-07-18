export interface Env {
  USAGE_KV: KVNamespace;
  /** wrangler secret put OPENAI_API_KEY */
  OPENAI_API_KEY: string;
  /** wrangler secret put APP_TOKEN — 모바일 앱이 보내는 Bearer 토큰 */
  APP_TOKEN: string;
  OPENAI_BASE_URL: string;
  OPENAI_MODEL: string;
  OPENAI_TTS_MODEL: string;
  FREE_DAILY_SCANS: string;
  /** OpenRouter only: comma-separated provider order, e.g. "Groq". Optional. */
  OPENROUTER_PROVIDER?: string;
  /** TTS voice id (provider-specific). Defaults to "alloy" (OpenAI). Optional. */
  OPENAI_TTS_VOICE?: string;
}
