import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface SceneCaptureProps {
  onCapture: (uri: string) => void;
  disabled?: boolean;
}

export function SceneCapture({ onCapture, disabled }: SceneCaptureProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShutter = async () => {
    if (disabled || isCapturing || !cameraRef.current) return;
    try {
      setIsCapturing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    if (disabled) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCapture(result.assets[0].uri);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingHorizontal: 32 }]}>
        <Feather name="camera" size={40} color={colors.mutedForeground} />
        <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
          Camera access needed
        </Text>
        <Text style={[styles.permissionBody, { color: colors.mutedForeground }]}>
          Visual Vocab uses your camera to identify objects around you and teach you their names.
        </Text>
        {permission.canAskAgain ? (
          <Pressable
            testID="request-camera-permission"
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: colors.primaryForeground }]}>
              Enable Camera
            </Text>
          </Pressable>
        ) : Platform.OS !== "web" ? (
          <Pressable
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openSettings().catch(() => {})}
          >
            <Text style={[styles.permissionButtonText, { color: colors.primaryForeground }]}>
              Open Settings
            </Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.galleryFallback} onPress={handlePickFromGallery}>
          <Text style={[styles.galleryFallbackText, { color: colors.primary }]}>
            Choose a photo instead
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          testID="pick-gallery-button"
          style={styles.secondaryButton}
          onPress={handlePickFromGallery}
          disabled={disabled}
        >
          <Feather name="image" size={24} color="#ffffff" />
        </Pressable>

        <Pressable
          testID="shutter-button"
          style={[styles.shutter, isCapturing && styles.shutterActive]}
          onPress={handleShutter}
          disabled={disabled || isCapturing}
        >
          {isCapturing ? <ActivityIndicator color="#0a0a0a" /> : <View style={styles.shutterInner} />}
        </Pressable>

        <View style={styles.secondaryButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterActive: { opacity: 0.7 },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffffff",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  permissionTitle: { fontSize: 20, fontWeight: "700", marginTop: 8, textAlign: "center" },
  permissionBody: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  permissionButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: { fontSize: 16, fontWeight: "700" },
  galleryFallback: { marginTop: 16, padding: 8 },
  galleryFallbackText: { fontSize: 15, fontWeight: "600" },
});
