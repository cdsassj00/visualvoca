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
  topInset?: number;
}

const PILL_HEIGHT = 44;
const PILL_GAP = 6;
const EDGE_MARGIN = 4;

function estimatePillWidth(word: string): number {
  let textWidth = 0;
  for (const ch of word) {
    // CJK characters render roughly twice as wide as Latin ones.
    textWidth += ch.charCodeAt(0) > 0x2e80 ? 20 : 11;
  }
  // horizontal padding (32) + speaker icon (16) + gap (8)
  return Math.max(88, Math.min(56 + textWidth, 220));
}

interface PlacedPill {
  object: DetectedObject;
  left: number;
  top: number;
  width: number;
}

function layoutPills(
  objects: DetectedObject[],
  containerWidth: number,
  containerHeight: number,
  topInset: number,
): PlacedPill[] {
  const sorted = [...objects].sort(
    (a, b) =>
      a.boundingBox.y + a.boundingBox.height / 2 - (b.boundingBox.y + b.boundingBox.height / 2),
  );

  const placed: PlacedPill[] = [];
  for (const object of sorted) {
    const width = estimatePillWidth(object.word);
    const centerX = (object.boundingBox.x + object.boundingBox.width / 2) * containerWidth;
    const centerY = (object.boundingBox.y + object.boundingBox.height / 2) * containerHeight;

    const left = Math.min(
      Math.max(centerX - width / 2, EDGE_MARGIN),
      Math.max(containerWidth - width - EDGE_MARGIN, EDGE_MARGIN),
    );
    let top = Math.max(centerY - PILL_HEIGHT / 2, topInset);

    // Nudge pills downward until they no longer overlap an already-placed pill.
    let moved = true;
    let guard = 0;
    while (moved && guard < 20) {
      moved = false;
      guard += 1;
      for (const other of placed) {
        const horizontalOverlap =
          left < other.left + other.width + PILL_GAP && other.left < left + width + PILL_GAP;
        const verticalOverlap =
          top < other.top + PILL_HEIGHT + PILL_GAP && other.top < top + PILL_HEIGHT + PILL_GAP;
        if (horizontalOverlap && verticalOverlap) {
          top = other.top + PILL_HEIGHT + PILL_GAP;
          moved = true;
        }
      }
    }
    const maxTop = Math.max(containerHeight - PILL_HEIGHT - EDGE_MARGIN, topInset);
    if (top > maxTop) {
      // Ran off the bottom — walk upward instead so pills near the bottom
      // edge don't stack on the same clamped row.
      top = maxTop;
      let movedUp = true;
      let upGuard = 0;
      while (movedUp && upGuard < 20 && top > topInset) {
        movedUp = false;
        upGuard += 1;
        for (const other of placed) {
          const horizontalOverlap =
            left < other.left + other.width + PILL_GAP && other.left < left + width + PILL_GAP;
          const verticalOverlap =
            top < other.top + PILL_HEIGHT + PILL_GAP && other.top < top + PILL_HEIGHT + PILL_GAP;
          if (horizontalOverlap && verticalOverlap) {
            top = Math.max(other.top - PILL_HEIGHT - PILL_GAP, topInset);
            movedUp = true;
          }
        }
      }
    }

    placed.push({ object, left, top, width });
  }
  return placed;
}

export function LabelOverlay({
  objects,
  containerWidth,
  containerHeight,
  selectedWord,
  playingWord = null,
  savedWords,
  onSelect,
  topInset = 8,
}: LabelOverlayProps) {
  const colors = useColors();

  if (containerWidth <= 0 || containerHeight <= 0) return null;

  const pills = layoutPills(objects, containerWidth, containerHeight, topInset);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/*
        Draw each detected region as a soft box. AI vision coordinates are only
        approximate, so a translucent box reads as "around here" and keeps the
        label visually tied to its object even when the pill is nudged aside.
      */}
      {objects.map((object) => {
        const isSelected = object.word === selectedWord;
        const boxLeft = object.boundingBox.x * containerWidth;
        const boxTop = object.boundingBox.y * containerHeight;
        const boxWidth = Math.max(object.boundingBox.width * containerWidth, 12);
        const boxHeight = Math.max(object.boundingBox.height * containerHeight, 12);
        return (
          <View
            key={`box-${object.id}`}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: boxLeft,
              top: boxTop,
              width: boxWidth,
              height: boxHeight,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: isSelected ? colors.primary : "rgba(255,255,255,0.9)",
              backgroundColor: isSelected ? "rgba(13,148,136,0.15)" : "rgba(249,115,85,0.12)",
            }}
          />
        );
      })}
      {pills.map(({ object, left, top, width }) => {
        const isSelected = object.word === selectedWord;
        const isPlaying = object.word === playingWord;
        const isSaved = savedWords.has(object.word);

        return (
          <Pressable
            key={object.id}
            testID={`label-pill-${object.id}`}
            onPress={() => onSelect(object)}
            style={[
              styles.pill,
              {
                left,
                top,
                width,
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
    height: PILL_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1.5,
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
    flexShrink: 1,
  },
  savedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
});
