import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { LANGUAGE_OPTIONS, LanguageCode } from "@/types/vocab";

interface LanguagePickerProps {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
  disabled?: boolean;
}

export function LanguagePicker({ value, onChange, disabled }: LanguagePickerProps) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      {LANGUAGE_OPTIONS.map((option) => {
        const active = option.code === value;
        return (
          <Pressable
            key={option.code}
            testID={`language-${option.code}`}
            disabled={disabled}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync();
              onChange(option.code);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {option.nativeLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
