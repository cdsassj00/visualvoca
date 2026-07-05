---
name: Expo/React Native Web Alert.alert no-op
description: React Native's Alert.alert does nothing when running under react-native-web (Expo web preview) — needed a platform-aware wrapper to make confirmation/error dialogs work in web preview and Playwright e2e tests.
---

`Alert.alert()` from `react-native` is implemented as an empty no-op method in `react-native-web`
(confirmed by reading `react-native-web/dist/exports/Alert/index.js` — `class Alert { static alert() {} }`).

**Why:** On native (iOS/Android via Expo Go), `Alert.alert` works normally. But any Expo app that also
runs a web preview (or is tested with an automated browser like Playwright) will silently fail any flow
that depends on an `Alert.alert` confirmation or error message — buttons appear to do nothing, with no
error thrown. This is easy to miss because it fails silently rather than crashing.

**How to apply:** Wrap alert/confirm calls in a small platform-aware helper, e.g.:

```ts
import { Alert, Platform } from "react-native";

export function showAlert(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirmDestructive(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
```

Use this wherever a destructive action (delete/remove) or an error message needs to reliably surface in
both native and web/preview contexts. This was discovered because an e2e test's delete-confirmation step
never found a dialog — the root cause was the no-op, not a bug in the app's business logic.
