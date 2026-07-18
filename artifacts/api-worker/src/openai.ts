import type { Env } from "./env";

type ChatContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export interface ChatMessage {
  role: "system" | "user";
  content: ChatContent;
}

/**
 * JSON-mode chat completion via raw fetch (no SDK — keeps the Worker bundle
 * tiny and avoids Node-only code paths).
 */
export async function chatCompletionJson(
  env: Env,
  messages: ChatMessage[],
  maxCompletionTokens: number,
): Promise<string> {
  const res = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      max_completion_tokens: maxCompletionTokens,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI chat completion failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  return data.choices?.[0]?.message?.content ?? "{}";
}

export async function textToSpeechBase64(env: Env, text: string): Promise<string> {
  const res = await fetch(`${env.OPENAI_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_TTS_MODEL,
      voice: "alloy",
      input: text,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI TTS failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const audio = await res.arrayBuffer();
  return arrayBufferToBase64(audio);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
