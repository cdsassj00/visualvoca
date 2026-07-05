import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
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
  const { isSaved, saveWord } = useVocab();

  const [language, setLanguage] = useState<LanguageCode>("ja");
  const [screenState, setScreenState] = useState<ScreenState>("camera");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState(3 / 4);
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, AudioCacheEntry>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const analyzeMutation = useAnalyzeScene();
  const speechMutation = useSynthesizeVocabSpeech();

  const handleCapture = useCallback(
    async (uri: string) => {
      setScreenState("analyzing");
      setSelectedObject(null);
      setAudioCache({});
      setSavedIds(new Set());
      try {
        const prepared = await prepareImageForAnalysis(uri);
        setImageUri(prepared.uri);
        setImageAspectRatio(prepared.width / prepared.height);
        const result = await analyzeMutation.mutateAsync({
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
    [analyzeMutation, language],
  );

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  const getOrFetchAudio = useCallback(
    async (object: DetectedObject): Promise<AudioCacheEntry> => {
      const cached = audioCache[object.id];
      if (cached) return cached;
      const result = await speechMutation.mutateAsync({
        data: { text: object.word, language },
      });
      const entry: AudioCacheEntry = { audioBase64: result.audioBase64, format: result.format };
      setAudioCache((prev) => ({ ...prev, [object.id]: entry }));
      return entry;
    },
    [audioCache, speechMutation, language],
  );

  const handlePlay = useCallback(async () => {
    if (!selectedObject || isPlaying) return;
    setIsPlaying(true);
    try {
      const entry = await getOrFetchAudio(selectedObject);
      await playBase64Audio(entry.audioBase64, entry.format);
    } catch (error) {
      showAlert(
        "Couldn't play pronunciation",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsPlaying(false);
    }
  }, [selectedObject, isPlaying, getOrFetchAudio]);

  const handleSave = useCallback(async () => {
    if (!selectedObject || isSaving) return;
    setIsSaving(true);
    try {
      const entry = await getOrFetchAudio(selectedObject);
      await saveWord(selectedObject, language, entry.audioBase64, entry.format);
      setSavedIds((prev) => new Set(prev).add(selectedObject.id));
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
        <SceneCapture onCapture={handleCapture} />
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
              selectedId={selectedObject?.id ?? null}
              savedIds={savedIds}
              onSelect={setSelectedObject}
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
              isSaved={isSaved(selectedObject.word, language) || savedIds.has(selectedObject.id)}
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
});
