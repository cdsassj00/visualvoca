import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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
  boundingBox: { x: number; y: number; width: number; height: number };
}

router.post("/vocab/analyze", async (req: Request, res: Response) => {
  const { imageBase64, language } = req.body as {
    imageBase64?: string;
    language?: string;
  };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const languageName = language ? LANGUAGE_NAMES[language] : undefined;
  if (!languageName) {
    res.status(400).json({ error: "Unsupported language" });
    return;
  }

  try {
    const needsRomanization = NEEDS_ROMANIZATION.has(language as string);

    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a vision assistant for a language-learning app. Identify the 5-10 most prominent, clearly identifiable physical objects in the photo. For each object return its English name, its translation into the target language, and a normalized bounding box (values 0 to 1) tightly framing the object relative to image width and height, where x/y is the top-left corner. " +
            (needsRomanization
              ? "Also provide a romanized/phonetic reading of the translated word."
              : "Set romanization to null.") +
            " For koreanPronunciation, transcribe how the translated word is pronounced using Korean Hangul (외래어 표기, e.g. ノートパソコン → 노토파소콘, laptop → 랩톱)." +
            ' Respond ONLY with JSON: { "objects": [ { "englishLabel": string, "word": string, "romanization": string|null, "koreanPronunciation": string|null, "boundingBox": { "x": number, "y": number, "width": number, "height": number } } ] }',
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
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      objects?: Array<{
        englishLabel?: string;
        word?: string;
        romanization?: string | null;
        koreanPronunciation?: string | null;
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
        boundingBox: {
          x: clamp01(o.boundingBox?.x ?? 0),
          y: clamp01(o.boundingBox?.y ?? 0),
          width: clamp01(o.boundingBox?.width ?? 0.1),
          height: clamp01(o.boundingBox?.height ?? 0.1),
        },
      }));

    res.json({ objects });
  } catch (err) {
    logger.error({ err }, "Failed to analyze scene");
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

router.post("/vocab/speech", async (req: Request, res: Response) => {
  const { text, language } = req.body as { text?: string; language?: string };

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text is required" });
    return;
  }

  if (!language || !LANGUAGE_NAMES[language]) {
    res.status(400).json({ error: "Unsupported language" });
    return;
  }

  try {
    const buffer = await textToSpeech(text, "alloy", "mp3");
    res.json({
      audioBase64: buffer.toString("base64"),
      format: "mp3",
    });
  } catch (err) {
    logger.error({ err }, "Failed to synthesize speech");
    res.status(500).json({ error: "Failed to synthesize speech" });
  }
});

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export default router;
