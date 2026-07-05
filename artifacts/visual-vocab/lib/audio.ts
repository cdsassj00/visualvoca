import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

let audioModeConfigured = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  audioModeConfigured = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // Non-fatal — playback can still proceed with default audio mode.
  }
}

function mimeTypeForFormat(format: string): string {
  switch (format) {
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "flac":
      return "audio/flac";
    case "opus":
      return "audio/opus";
    default:
      return "audio/mpeg";
  }
}

/**
 * Plays base64-encoded audio (e.g. TTS output) and resolves once playback finishes.
 */
export async function playBase64Audio(audioBase64: string, format: string): Promise<void> {
  await ensureAudioMode();

  const uri = `data:${mimeTypeForFormat(format)};base64,${audioBase64}`;
  const player = createAudioPlayer(uri);

  return new Promise<void>((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      subscription.remove();
      clearTimeout(safetyTimeout);
      player.remove();
      resolve();
    };

    const subscription = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        finish();
      }
    });

    const safetyTimeout = setTimeout(finish, 20000);

    player.play();
  });
}
