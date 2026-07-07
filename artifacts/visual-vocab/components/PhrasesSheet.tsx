import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { ScenePhrase } from "@workspace/api-client-react";

interface PhrasesSheetProps {
  situation: string;
  phrases: ScenePhrase[];
  isLoading: boolean;
  playingPhraseId: string | null;
  onPlay: (phrase: ScenePhrase) => void;
  onClose: () => void;
}

export function PhrasesSheet({
  situation,
  phrases,
  isLoading,
  playingPhraseId,
  onPlay,
  onClose,
}: PhrasesSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // The tab bar is an absolute overlay, so the sheet's bottom padding must
  // clear it to keep the last row fully visible.
  const tabBarOffset = Platform.OS === "web" ? 84 : 56 + insets.bottom;

  return (
    <View style={styles.backdrop}>
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: tabBarOffset + 20,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>상황 회화 표현</Text>
            {situation ? (
              <Text style={[styles.situation, { color: colors.mutedForeground }]}>{situation}</Text>
            ) : null}
          </View>
          <Pressable testID="close-phrases-sheet" style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              이 상황에 맞는 표현을 찾고 있어요…
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
            {phrases.map((phrase) => {
              const isPlaying = playingPhraseId === phrase.id;
              return (
                <Pressable
                  key={phrase.id}
                  testID={`phrase-row-${phrase.id}`}
                  style={[styles.row, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => onPlay(phrase)}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.phrase, { color: colors.foreground }]}>{phrase.phrase}</Text>
                    {phrase.koreanPronunciation ? (
                      <Text style={[styles.pronunciation, { color: colors.primary }]}>
                        {phrase.koreanPronunciation}
                      </Text>
                    ) : null}
                    {phrase.romanization ? (
                      <Text style={[styles.romanization, { color: colors.mutedForeground }]}>
                        {phrase.romanization}
                      </Text>
                    ) : null}
                    <Text style={[styles.meaning, { color: colors.mutedForeground }]}>
                      {phrase.meaning}
                    </Text>
                  </View>
                  <View style={[styles.playIcon, { backgroundColor: colors.primary }]}>
                    {isPlaying ? (
                      <ActivityIndicator color={colors.primaryForeground} size="small" />
                    ) : (
                      <Feather name="volume-2" size={16} color={colors.primaryForeground} />
                    )}
                  </View>
                </Pressable>
              );
            })}
            {phrases.length === 0 ? (
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                추천할 표현을 찾지 못했어요. 다시 시도해 보세요.
              </Text>
            ) : null}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    zIndex: 30,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: "80%",
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: { fontSize: 19, fontWeight: "800" },
  situation: { fontSize: 14 },
  closeButton: { padding: 4 },
  loading: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: { fontSize: 14, textAlign: "center" },
  list: { flexGrow: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  phrase: { fontSize: 18, fontWeight: "700" },
  pronunciation: { fontSize: 15, fontWeight: "700" },
  romanization: { fontSize: 13, fontStyle: "italic" },
  meaning: { fontSize: 14, marginTop: 2 },
  playIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
