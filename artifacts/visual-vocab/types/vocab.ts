import { LanguageCode as LanguageCodeEnum } from "@workspace/api-client-react";

export type LanguageCode = LanguageCodeEnum;

export interface LanguageOption {
  code: LanguageCode;
  englishLabel: string;
  nativeLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", englishLabel: "English", nativeLabel: "English" },
  { code: "ja", englishLabel: "Japanese", nativeLabel: "日本語" },
  { code: "zh", englishLabel: "Chinese", nativeLabel: "中文" },
  { code: "es", englishLabel: "Spanish", nativeLabel: "Español" },
];

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  id: string;
  englishLabel: string;
  word: string;
  romanization: string | null;
  boundingBox: BoundingBox;
}

export interface SavedWord {
  id: string;
  englishLabel: string;
  word: string;
  romanization: string | null;
  language: LanguageCode;
  audioBase64: string;
  audioFormat: string;
  savedAt: number;
}

export function savedWordKey(word: string, language: LanguageCode): string {
  return `${language}:${word}`;
}
