import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { ScenePhrase } from "@workspace/api-client-react";

interface PhrasesPanelProps {
  situation: string;
  phrases: ScenePhrase[];
  isLoading: boolean;
  playingPhraseId: string | null;
  onPlay: (phrase: ScenePhrase) => void;
}

/**
 * Inline (non-modal) situational phrases, shown directly below the scanned
 * scene so useful expressions for the current situation are always visible —
 * no extra tap required.
 */
export function PhrasesPanel({
  situation,
  phrases,
  isLoading,
  playingPhraseId,
  onPlay,
}: PhrasesPanelProps) {
  const colors = useColors();

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Feather name="message-circle" size={16} color={colors.accent} />
        <Text style={[styles.title, { color: colors.foreground }]}>이 상황에서 자주 쓰는 표현</Text>
      </View>
      {situation ? (
        <Text style={[styles.situation, { color: colors.mutedForeground }]}>{situation}</Text>
      ) : null}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            이 상황에 맞는 표현을 찾고 있어요…
          </Text>
        </View>
      ) : phrases.length === 0 ? (
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          추천할 표현을 찾지 못했어요.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {phrases.map((phrase) => {
            const isPlaying = playingPhraseId === phrase.id;
            return (
              <Pressable
                key={phrase.id}
                testID={`phrase-panel-row-${phrase.id}`}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 17, fontWeight: "800" },
  situation: { fontSize: 14, marginBottom: 4 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 24 },
  loadingText: { fontSize: 14, textAlign: "center", paddingVertical: 8 },
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
