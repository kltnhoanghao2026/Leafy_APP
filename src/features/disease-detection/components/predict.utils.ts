import { Dimensions, Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

import type { LeafDetection } from "@/src/features/disease-detection/api/disease-detection.api";
import type { ImageSize, ScaledBox } from "./predict.types";

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const IMAGE_PADDING = 32; // 16px each side
export const IMAGE_DISPLAY_WIDTH = SCREEN_WIDTH - IMAGE_PADDING;

export const commonShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  android: {
    elevation: 6,
  },
  default: {},
});

export const getConfidenceColor = (score: number): string => {
  if (score >= 0.8) return "#16A34A";
  if (score >= 0.5) return "#F59E0B";
  return "#EF4444";
};

export const scaleBox = (
  bb: LeafDetection["boundingBox"],
  imageSize: ImageSize,
  containerHeight: number,
): ScaledBox => {
  if (!imageSize.width || !imageSize.height)
    return { left: 0, top: 0, width: 0, height: 0 };

  const scaleW = IMAGE_DISPLAY_WIDTH / imageSize.width;
  const scaleH = containerHeight / imageSize.height;
  const scale = Math.min(scaleW, scaleH);

  const renderedW = imageSize.width * scale;
  const renderedH = imageSize.height * scale;
  const offsetX = (IMAGE_DISPLAY_WIDTH - renderedW) / 2;
  const offsetY = (containerHeight - renderedH) / 2;

  return {
    left: offsetX + bb.x1 * scale,
    top: offsetY + bb.y1 * scale,
    width: (bb.x2 - bb.x1) * scale,
    height: (bb.y2 - bb.y1) * scale,
  };
};

export const getDisplayImageHeight = (imageSize: ImageSize): number =>
  imageSize.width
    ? Math.min((IMAGE_DISPLAY_WIDTH / imageSize.width) * imageSize.height, 250)
    : 250;

export const cropLeafImage = async (
  imageUri: string,
  boundingBox: LeafDetection["boundingBox"],
  imageSize: ImageSize,
): Promise<string> => {
  const pad = 10;
  const x = Math.max(0, Math.floor(boundingBox.x1) - pad);
  const y = Math.max(0, Math.floor(boundingBox.y1) - pad);
  const w = Math.min(
    imageSize.width - x,
    Math.ceil(boundingBox.x2 - boundingBox.x1) + pad * 2,
  );
  const h = Math.min(
    imageSize.height - y,
    Math.ceil(boundingBox.y2 - boundingBox.y1) + pad * 2,
  );

  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ crop: { originX: x, originY: y, width: w, height: h } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return manipulated.uri;
};

// ── Localized Disease Mappings ──────────────────────────────────
export const DISEASE_LABELS: Record<string, string> = {
  healthy: "Khỏe mạnh",
  miner: "Sâu đục lá",
  phoma: "Đốm nâu",
  red_spider_mite: "Nhện đỏ",
  rust: "Gỉ sắt",
};

export const normalizeDiseaseKey = (value: string): string =>
  value.trim().toLowerCase().replace(/ /g, "_").replace(/-/g, "_");

export const getDiseaseLabel = (value?: string | null): string => {
  if (!value) {
    return "Không rõ";
  }
  const key = normalizeDiseaseKey(value);
  return DISEASE_LABELS[key] ?? value.replace(/_/g, " ");
};

export const isHealthyDisease = (value?: string | null): boolean =>
  normalizeDiseaseKey(value ?? "") === "healthy";
