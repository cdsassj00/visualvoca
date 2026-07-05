import { Feather } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVocab } from "@/context/VocabContext";
import { useColors } from "@/hooks/useColors";
import { confirmDestructive, showAlert } from "@/lib/alert";
import { playBase64Audio } from "@/lib/audio";
import { LANGUAGE_OPTIONS, SavedWord } from "@/types/vocab";

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedWords, isLoading, removeWord } = useVocab();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlay = useCallback(
    async (word: SavedWord) => {
      if (playingId) return;
      setPlayingId(word.id);
      try {
        await playBase64Audio(word.audioBase64, word.audioFormat);
      } catch (error) {
        showAlert(
          "Couldn't play pronunciation",
          error instanceof Error ? error.message : "Please try again.",
        );
      } finally {
        setPlayingId(null);
      }
    },
    [playingId],
  );

  const handleRemove = useCallback(
    (word: SavedWord) => {
      confirmDestructive(
        "Remove word?",
        `Remove "${word.word}" from your saved list.`,
        "Remove",
        () => removeWord(word.id),
      );
    },
    [removeWord],
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (savedWords.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingHorizontal: 32 }]}>
        <Feather name="bookmark" size={36} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved words yet</Text>
        <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
          Scan an object and tap "Save" to build your vocab list. Saved words work offline.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      data={savedWords}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const languageLabel =
          LANGUAGE_OPTIONS.find((option) => option.code === item.language)?.englishLabel ?? item.language;
        return (
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.wordInfo}>
              <Text style={[styles.languageTag, { color: colors.mutedForeground }]}>
                {languageLabel} · {item.englishLabel}
              </Text>
              <Text style={[styles.word, { color: colors.foreground }]}>{item.word}</Text>
              {item.koreanPronunciation ? (
                <Text style={[styles.koreanPronunciation, { color: colors.primary }]}>
                  {item.koreanPronunciation}
                </Text>
              ) : null}
              {item.romanization ? (
                <Text style={[styles.romanization, { color: colors.mutedForeground }]}>
                  {item.romanization}
                </Text>
              ) : null}
            </View>

            <View style={styles.rowActions}>
              <Pressable
                testID={`play-saved-${item.id}`}
                style={[styles.iconButton, { backgroundColor: colors.primary }]}
                onPress={() => handlePlay(item)}
                disabled={playingId === item.id}
              >
                {playingId === item.id ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <Feather name="volume-2" size={18} color={colors.primaryForeground} />
                )}
              </Pressable>
              <Pressable
                testID={`remove-saved-${item.id}`}
                style={[styles.iconButton, { backgroundColor: colors.muted }]}
                onPress={() => handleRemove(item)}
              >
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  wordInfo: { flex: 1, gap: 2 },
  languageTag: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  word: { fontSize: 24, fontWeight: "800" },
  koreanPronunciation: { fontSize: 17, fontWeight: "700" },
  romanization: { fontSize: 14, fontStyle: "italic" },
  rowActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
