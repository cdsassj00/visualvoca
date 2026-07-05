import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { DetectedObject, LanguageCode, SavedWord, savedWordKey } from "@/types/vocab";

const STORAGE_KEY = "visual-vocab/saved-words";

interface VocabContextValue {
  savedWords: SavedWord[];
  isLoading: boolean;
  isSaved: (word: string, language: LanguageCode) => boolean;
  saveWord: (
    object: DetectedObject,
    language: LanguageCode,
    audioBase64: string,
    audioFormat: string,
  ) => Promise<void>;
  removeWord: (id: string) => Promise<void>;
}

const VocabContext = createContext<VocabContextValue | null>(null);

export function VocabProvider({ children }: { children: ReactNode }) {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && raw) {
          setSavedWords(JSON.parse(raw) as SavedWord[]);
        }
      } catch {
        // Corrupt storage — start fresh rather than crashing the app.
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const persist = useCallback(async (next: SavedWord[]) => {
    setSavedWords(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Best-effort persistence — in-memory state still reflects the change.
    }
  }, []);

  const isSaved = useCallback(
    (word: string, language: LanguageCode) => {
      const key = savedWordKey(word, language);
      return savedWords.some((entry) => savedWordKey(entry.word, entry.language) === key);
    },
    [savedWords],
  );

  const saveWord = useCallback(
    async (object: DetectedObject, language: LanguageCode, audioBase64: string, audioFormat: string) => {
      if (isSaved(object.word, language)) return;
      const entry: SavedWord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        englishLabel: object.englishLabel,
        word: object.word,
        romanization: object.romanization,
        koreanPronunciation: object.koreanPronunciation,
        language,
        audioBase64,
        audioFormat,
        savedAt: Date.now(),
      };
      await persist([entry, ...savedWords]);
    },
    [savedWords, isSaved, persist],
  );

  const removeWord = useCallback(
    async (id: string) => {
      await persist(savedWords.filter((entry) => entry.id !== id));
    },
    [savedWords, persist],
  );

  const value = useMemo(
    () => ({ savedWords, isLoading, isSaved, saveWord, removeWord }),
    [savedWords, isLoading, isSaved, saveWord, removeWord],
  );

  return <VocabContext.Provider value={value}>{children}</VocabContext.Provider>;
}

export function useVocab() {
  const context = useContext(VocabContext);
  if (!context) {
    throw new Error("useVocab must be used within a VocabProvider");
  }
  return context;
}
