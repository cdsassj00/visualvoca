import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { DetectedObject } from "@/types/vocab";

interface LabelOverlayProps {
  objects: DetectedObject[];
  containerWidth: number;
  containerHeight: number;
  selectedId: string | null;
  savedIds: Set<string>;
  onSelect: (object: DetectedObject) => void;
}

export function LabelOverlay({
  objects,
  containerWidth,
  containerHeight,
  selectedId,
  savedIds,
  onSelect,
}: LabelOverlayProps) {
  const colors = useColors();

  if (containerWidth <= 0 || containerHeight <= 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {objects.map((object) => {
        const isSelected = object.id === selectedId;
        const isSaved = savedIds.has(object.id);
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
                top: Math.max(top - 36, 8),
                backgroundColor: isSelected ? colors.primary : colors.accent,
                borderColor: "#ffffff",
              },
            ]}
          >
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    transform: [{ translateX: -40 }],
    maxWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pillText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  savedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
});
