import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { DetectedObject } from "@/types/vocab";

interface LabelOverlayProps {
  objects: DetectedObject[];
  containerWidth: number;
  containerHeight: number;
  selectedWord: string | null;
  playingWord?: string | null;
  savedWords: Set<string>;
  onSelect: (object: DetectedObject) => void;
}

export function LabelOverlay({
  objects,
  containerWidth,
  containerHeight,
  selectedWord,
  playingWord = null,
  savedWords,
  onSelect,
}: LabelOverlayProps) {
  const colors = useColors();

  if (containerWidth <= 0 || containerHeight <= 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {objects.map((object) => {
        const isSelected = object.word === selectedWord;
        const isPlaying = object.word === playingWord;
        const isSaved = savedWords.has(object.word);
        const centerX = (object.boundingBox.x + object.boundingBox.width / 2) * containerWidth;
        const top = object.boundingBox.y * containerHeight;

        return (
          <Pressable
            key={object.id}
            testID={`label-pill-${object.id}`}
            onPress={() => onSelect(object)}
            style={[
              styles.pill,
              {
                left: centerX,
                top: Math.max(top - 48, 8),
                backgroundColor: isSelected ? colors.primary : colors.accent,
                borderColor: "#ffffff",
              },
            ]}
          >
            {isPlaying ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Feather name="volume-2" size={16} color="rgba(255,255,255,0.9)" />
            )}
            <Text style={styles.pillText} numberOfLines={1}>
              {object.word}
            </Text>
            {isSaved ? <View style={styles.savedDot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    transform: [{ translateX: -60 }],
    maxWidth: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pillText: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "800",
  },
  savedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
});
