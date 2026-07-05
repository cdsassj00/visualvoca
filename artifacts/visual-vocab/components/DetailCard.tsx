import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { DetectedObject } from "@/types/vocab";

interface DetailCardProps {
  object: DetectedObject;
  isSaved: boolean;
  isPlaying: boolean;
  isSaving: boolean;
  onPlay: () => void;
  onSave: () => void;
  onClose: () => void;
}

export function DetailCard({
  object,
  isSaved,
  isPlaying,
  isSaving,
  onPlay,
  onSave,
  onClose,
}: DetailCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable testID="close-detail-card" style={styles.closeButton} onPress={onClose}>
        <Feather name="x" size={18} color={colors.mutedForeground} />
      </Pressable>

      <Text style={[styles.englishLabel, { color: colors.mutedForeground }]}>
        {object.englishLabel}
      </Text>
      <Text style={[styles.word, { color: colors.foreground }]}>{object.word}</Text>
      {object.koreanPronunciation ? (
        <Text style={[styles.koreanPronunciation, { color: colors.primary }]}>
          {object.koreanPronunciation}
        </Text>
      ) : null}
      {object.romanization ? (
        <Text style={[styles.romanization, { color: colors.mutedForeground }]}>
          {object.romanization}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          testID="play-pronunciation-button"
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onPlay}
          disabled={isPlaying}
        >
          {isPlaying ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Feather name="volume-2" size={20} color={colors.primaryForeground} />
          )}
          <Text style={[styles.actionText, { color: colors.primaryForeground }]}>Listen</Text>
        </Pressable>

        <Pressable
          testID="save-word-button"
          style={[
            styles.actionButton,
            {
              backgroundColor: isSaved ? colors.secondary : colors.accent,
            },
          ]}
          onPress={onSave}
          disabled={isSaved || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={isSaved ? colors.secondaryForeground : "#ffffff"} size="small" />
          ) : (
            <Feather
              name={isSaved ? "check" : "bookmark"}
              size={20}
              color={isSaved ? colors.secondaryForeground : "#ffffff"}
            />
          )}
          <Text
            style={[
              styles.actionText,
              { color: isSaved ? colors.secondaryForeground : "#ffffff" },
            ]}
          >
            {isSaved ? "Saved" : "Save"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 4,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 6,
  },
  englishLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  word: {
    fontSize: 38,
    fontWeight: "800",
    marginTop: 2,
  },
  koreanPronunciation: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  romanization: {
    fontSize: 16,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
