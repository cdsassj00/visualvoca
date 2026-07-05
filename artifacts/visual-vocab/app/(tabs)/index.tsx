import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DetailCard } from "@/components/DetailCard";
import { LabelOverlay } from "@/components/LabelOverlay";
import { LanguagePicker } from "@/components/LanguagePicker";
import { SceneCapture } from "@/components/SceneCapture";
import { useVocab } from "@/context/VocabContext";
import { useColors } from "@/hooks/useColors";
import { showAlert } from "@/lib/alert";
import { playBase64Audio } from "@/lib/audio";
import { prepareImageForAnalysis } from "@/lib/image";
import { DetectedObject, LanguageCode } from "@/types/vocab";
import { useAnalyzeScene, useSynthesizeVocabSpeech } from "@workspace/api-client-react";

type ScreenState = "camera" | "analyzing" | "results";

interface AudioCacheEntry {
  audioBase64: string;
  format: string;
}

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedWords: savedVocab, isSaved, saveWord } = useVocab();

  const [language, setLanguage] = useState<LanguageCode>("ja");
  const [screenState, setScreenState] = useState<ScreenState>("camera");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState(3 / 4);
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, AudioCacheEntry>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [liveMode, setLiveMode] = useState(false);
  const [liveObjects, setLiveObjects] = useState<DetectedObject[]>([]);
  const [liveStatus, setLiveStatus] = useState<"idle" | "analyzing">("idle");
  const [liveSize, setLiveSize] = useState({ width: 0, height: 0 });
  const audioCacheRef = useRef(audioCache);
  audioCacheRef.current = audioCache;
  const liveModeRef = useRef(liveMode);
  liveModeRef.current = liveMode;

  const savedWordSet = useMemo(
    () =>
      new Set(
        savedVocab.filter((entry) => entry.language === language).map((entry) => entry.word),
      ),
    [savedVocab, language],
  );

  const analyzeMutation = useAnalyzeScene();
  const speechMutation = useSynthesizeVocabSpeech();
  const analyzeAsync = analyzeMutation.mutateAsync;
  const speechAsync = speechMutation.mutateAsync;

  const handleCapture = useCallback(
    async (uri: string) => {
      setLiveMode(false);
      setLiveObjects([]);
      setScreenState("analyzing");
      setSelectedObject(null);
      try {
        const prepared = await prepareImageForAnalysis(uri);
        setImageUri(prepared.uri);
        setImageAspectRatio(prepared.width / prepared.height);
        const result = await analyzeAsync({
          data: { imageBase64: prepared.base64, language },
        });
        setObjects(result.objects);
        setScreenState("results");
      } catch (error) {
        showAlert(
          "Couldn't analyze photo",
          error instanceof Error ? error.message : "Something went wrong. Please try again.",
        );
        setScreenState("camera");
      }
    },
    [analyzeAsync, language],
  );

  const handleLiveFrame = useCallback(
    async (uri: string) => {
      if (!liveModeRef.current) return;
      setLiveStatus("analyzing");
      try {
        const prepared = await prepareImageForAnalysis(uri);
        const result = await analyzeAsync({
          data: { imageBase64: prepared.base64, language },
        });
        // Ignore responses that resolve after live mode was toggled off.
        if (liveModeRef.current) {
          setLiveObjects(result.objects);
        }
      } catch {
        // Live frames fail silently — the next frame retries automatically.
      } finally {
        setLiveStatus("idle");
      }
    },
    [analyzeAsync, language],
  );

  const handleToggleLive = useCallback(() => {
    setLiveMode((prev) => {
      if (prev) {
        setLiveObjects([]);
        setSelectedObject(null);
        setLiveStatus("idle");
      }
      return !prev;
    });
  }, []);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  const handleLiveLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLiveSize({ width, height });
  }, []);

  const getOrFetchAudio = useCallback(
    async (object: DetectedObject): Promise<AudioCacheEntry> => {
      const cacheKey = `${language}:${object.word}`;
      const cached = audioCacheRef.current[cacheKey];
      if (cached) return cached;
      const result = await speechAsync({
        data: { text: object.word, language },
      });
      const entry: AudioCacheEntry = { audioBase64: result.audioBase64, format: result.format };
      setAudioCache((prev) => ({ ...prev, [cacheKey]: entry }));
      return entry;
    },
    [speechAsync, language],
  );

  const playObject = useCallback(
    async (object: DetectedObject) => {
      if (isPlaying) return;
      setIsPlaying(true);
      setPlayingWord(object.word);
      try {
        const entry = await getOrFetchAudio(object);
        await playBase64Audio(entry.audioBase64, entry.format);
      } catch (error) {
        showAlert(
          "Couldn't play pronunciation",
          error instanceof Error ? error.message : "Please try again.",
        );
      } finally {
        setIsPlaying(false);
        setPlayingWord(null);
      }
    },
    [isPlaying, getOrFetchAudio],
  );

  const handleSelectObject = useCallback(
    (object: DetectedObject) => {
      setSelectedObject(object);
      // Speak immediately on tap — no extra button press needed.
      void playObject(object);
    },
    [playObject],
  );

  const handlePlay = useCallback(async () => {
    if (!selectedObject) return;
    await playObject(selectedObject);
  }, [selectedObject, playObject]);

  const handleSave = useCallback(async () => {
    if (!selectedObject || isSaving) return;
    setIsSaving(true);
    try {
      const entry = await getOrFetchAudio(selectedObject);
      await saveWord(selectedObject, language, entry.audioBase64, entry.format);
    } catch (error) {
      showAlert("Couldn't save word", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [selectedObject, isSaving, getOrFetchAudio, saveWord, language]);

  const handleRetake = useCallback(() => {
    setScreenState("camera");
    setImageUri(null);
    setObjects([]);
    setSelectedObject(null);
  }, []);

  if (screenState === "camera") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.languageBar, { paddingTop: insets.top + 12 }]}>
          <LanguagePicker value={language} onChange={setLanguage} />
        </View>
        <View style={styles.cameraArea} onLayout={handleLiveLayout}>
          <SceneCapture
            onCapture={handleCapture}
            live={liveMode}
            onToggleLive={handleToggleLive}
            onLiveFrame={handleLiveFrame}
            liveStatus={liveStatus}
            overlay={
              liveMode && liveObjects.length > 0 ? (
                <LabelOverlay
                  objects={liveObjects}
                  containerWidth={liveSize.width}
                  containerHeight={liveSize.height}
                  selectedWord={selectedObject?.word ?? null}
                  playingWord={playingWord}
                  savedWords={savedWordSet}
                  onSelect={handleSelectObject}
                />
              ) : null
            }
          />
          {liveMode && selectedObject ? (
            <View style={[styles.liveDetailWrapper, { bottom: insets.bottom + 180 }]}>
              <DetailCard
                object={selectedObject}
                isSaved={isSaved(selectedObject.word, language)}
                isPlaying={isPlaying}
                isSaving={isSaving}
                onPlay={handlePlay}
                onSave={handleSave}
                onClose={() => setSelectedObject(null)}
              />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={[styles.languageBar, { paddingTop: insets.top + 12, paddingHorizontal: 16 }]}>
          <LanguagePicker value={language} onChange={setLanguage} disabled />
          <Pressable
            testID="retake-button"
            style={[styles.retakeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleRetake}
          >
            <Feather name="camera" size={16} color={colors.foreground} />
            <Text style={[styles.retakeText, { color: colors.foreground }]}>Retake</Text>
          </Pressable>
        </View>

        <View style={styles.imageWrapper} onLayout={handleContainerLayout}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[styles.image, { aspectRatio: imageAspectRatio }]}
              contentFit="cover"
            />
          ) : null}

          {screenState === "analyzing" ? (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator color="#ffffff" size="large" />
              <Text style={styles.analyzingText}>Identifying objects…</Text>
            </View>
          ) : (
            <LabelOverlay
              objects={objects}
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              selectedWord={selectedObject?.word ?? null}
              playingWord={playingWord}
              savedWords={savedWordSet}
              onSelect={handleSelectObject}
            />
          )}
        </View>

        {screenState === "results" && objects.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No objects recognized. Try a clearer shot with more light.
            </Text>
          </View>
        ) : null}

        {selectedObject ? (
          <View style={styles.detailWrapper}>
            <DetailCard
              object={selectedObject}
              isSaved={isSaved(selectedObject.word, language)}
              isPlaying={isPlaying}
              isSaving={isSaving}
              onPlay={handlePlay}
              onSave={handleSave}
              onClose={() => setSelectedObject(null)}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cameraArea: { flex: 1, position: "relative" },
  languageBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    zIndex: 10,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  retakeText: { fontSize: 13, fontWeight: "600" },
  imageWrapper: {
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  analyzingText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 15, textAlign: "center" },
  detailWrapper: {
    padding: 16,
  },
  liveDetailWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
  },
});
