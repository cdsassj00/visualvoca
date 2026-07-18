import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export interface CapturedImage {
  uri: string;
  base64: string;
  width: number;
  height: number;
}

// 640px면 흔한 사물 인식엔 충분하면서 업로드·모델 처리 지연을 크게 줄인다.
const MAX_DIMENSION = 640;

/**
 * Downscales and JPEG-compresses a captured photo so it's fast to upload,
 * then returns the base64 payload the backend expects.
 */
export async function prepareImageForAnalysis(uri: string): Promise<CapturedImage> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.7, format: SaveFormat.JPEG, base64: true },
  );

  if (!result.base64) {
    throw new Error("Failed to encode image for analysis");
  }

  return {
    uri: result.uri,
    base64: result.base64,
    width: result.width,
    height: result.height,
  };
}
