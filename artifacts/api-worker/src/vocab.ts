import { Hono } from "hono";

import type { Env } from "./env";
import { chatCompletionJson, textToSpeechBase64 } from "./openai";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  zh: "Mandarin Chinese",
  es: "Spanish",
};

const NEEDS_ROMANIZATION = new Set(["ja", "zh"]);

interface DetectedObjectPayload {
  id: string;
  englishLabel: string;
  word: string;
  romanization: string | null;
  koreanPronunciation: string | null;
  koreanMeaning: string | null;
  boundingBox: { x: number; y: number; width: number; height: number };
}

interface ScenePhrasePayload {
  id: string;
  phrase: string;
  meaning: string;
  romanization: string | null;
  koreanPronunciation: string | null;
}

const vocab = new Hono<{ Bindings: Env }>();

vocab.post("/vocab/analyze", async (c) => {
  const { imageBase64, language } = await c.req.json<{
    imageBase64?: string;
    language?: string;
  }>();

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return c.json({ error: "imageBase64 is required" }, 400);
  }

  const languageName = language ? LANGUAGE_NAMES[language] : undefined;
  if (!languageName) {
    return c.json({ error: "Unsupported language" }, 400);
  }

  try {
    const needsRomanization = NEEDS_ROMANIZATION.has(language as string);

    const raw = await chatCompletionJson(
      c.env,
      [
        {
          role: "system",
          content:
            "You are a vision assistant for a language-learning app. Identify up to 5 of the most prominent, clearly identifiable physical objects in the photo. For each object return its English name, its translation into the target language, and a normalized bounding box (values 0 to 1) tightly framing the object relative to image width and height, where x/y is the top-left corner. " +
            (needsRomanization
              ? "Also provide a romanized/phonetic reading of the translated word."
              : "Set romanization to null.") +
            " For koreanPronunciation, transcribe how the translated word is pronounced using Korean Hangul (외래어 표기, e.g. ノートパソコン → 노토파소콘, laptop → 랩톱)." +
            " For koreanMeaning, give what the object is actually called in Korean — its meaning, not its sound (e.g. メガネ → 안경, laptop → 노트북)." +
            ' Respond ONLY with JSON: { "objects": [ { "englishLabel": string, "word": string, "romanization": string|null, "koreanPronunciation": string|null, "koreanMeaning": string|null, "boundingBox": { "x": number, "y": number, "width": number, "height": number } } ] }',
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify objects in this photo and translate their names into ${languageName}.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      1536,
    );

    const parsed = JSON.parse(raw) as {
      objects?: Array<{
        englishLabel?: string;
        word?: string;
        romanization?: string | null;
        koreanPronunciation?: string | null;
        koreanMeaning?: string | null;
        boundingBox?: { x?: number; y?: number; width?: number; height?: number };
      }>;
    };

    const objects: DetectedObjectPayload[] = (parsed.objects ?? [])
      .filter((o) => o.englishLabel && o.word && o.boundingBox)
      .map((o, index) => ({
        id: `${Date.now()}-${index}`,
        englishLabel: o.englishLabel as string,
        word: o.word as string,
        romanization: o.romanization ?? null,
        koreanPronunciation: o.koreanPronunciation ?? null,
        koreanMeaning: o.koreanMeaning ?? null,
        boundingBox: {
          x: clamp01(o.boundingBox?.x ?? 0),
          y: clamp01(o.boundingBox?.y ?? 0),
          width: clamp01(o.boundingBox?.width ?? 0.1),
          height: clamp01(o.boundingBox?.height ?? 0.1),
        },
      }));

    return c.json({ objects });
  } catch (err) {
    console.error("Failed to analyze scene", err);
    return c.json({ error: "Failed to analyze image" }, 500);
  }
});

vocab.post("/vocab/phrases", async (c) => {
  const { objectLabels, language } = await c.req.json<{
    objectLabels?: string[];
    language?: string;
  }>();

  if (!Array.isArray(objectLabels) || objectLabels.length === 0) {
    return c.json({ error: "objectLabels is required" }, 400);
  }

  const languageName = language ? LANGUAGE_NAMES[language] : undefined;
  if (!languageName) {
    return c.json({ error: "Unsupported language" }, 400);
  }

  try {
    const needsRomanization = NEEDS_ROMANIZATION.has(language as string);
    const labels = objectLabels.slice(0, 12).join(", ");

    const raw = await chatCompletionJson(
      c.env,
      [
        {
          role: "system",
          content:
            "You are a conversation coach for a Korean-speaking language learner. Given a list of objects visible around the learner, infer the most likely real-world situation (e.g. cafe, kitchen, office, street) and suggest 5 short, practical conversational phrases in the target language that the learner would actually say in that situation. Keep phrases short (3-10 words), natural, and immediately useful. " +
            (needsRomanization
              ? "Provide a romanized/phonetic reading for each phrase."
              : "Set romanization to null.") +
            " For koreanPronunciation, transcribe how each phrase is pronounced using Korean Hangul (외래어 표기). For situation and meaning, write natural Korean." +
            ' Respond ONLY with JSON: { "situation": string (short Korean description of the situation), "phrases": [ { "phrase": string, "meaning": string (Korean translation), "romanization": string|null, "koreanPronunciation": string|null } ] }',
        },
        {
          role: "user",
          content: `Objects visible in the scene: ${labels}. Target language: ${languageName}. Suggest situational phrases.`,
        },
      ],
      1200,
    );

    const parsed = JSON.parse(raw) as {
      situation?: string;
      phrases?: Array<{
        phrase?: string;
        meaning?: string;
        romanization?: string | null;
        koreanPronunciation?: string | null;
      }>;
    };

    const phrases: ScenePhrasePayload[] = (parsed.phrases ?? [])
      .filter((p) => p.phrase && p.meaning)
      .map((p, index) => ({
        id: `phrase-${Date.now()}-${index}`,
        phrase: p.phrase as string,
        meaning: p.meaning as string,
        romanization: p.romanization ?? null,
        koreanPronunciation: p.koreanPronunciation ?? null,
      }));

    return c.json({ situation: parsed.situation ?? "", phrases });
  } catch (err) {
    console.error("Failed to suggest phrases", err);
    return c.json({ error: "Failed to suggest phrases" }, 500);
  }
});

vocab.post("/vocab/speech", async (c) => {
  const { text, language } = await c.req.json<{ text?: string; language?: string }>();

  if (!text || typeof text !== "string") {
    return c.json({ error: "text is required" }, 400);
  }

  if (!language || !LANGUAGE_NAMES[language]) {
    return c.json({ error: "Unsupported language" }, 400);
  }

  try {
    const audioBase64 = await textToSpeechBase64(c.env, text);
    return c.json({ audioBase64, format: "mp3" });
  } catch (err) {
    console.error("Failed to synthesize speech", err);
    return c.json({ error: "Failed to synthesize speech" }, 500);
  }
});

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export default vocab;
