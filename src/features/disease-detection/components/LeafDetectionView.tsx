import React from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";

import type { LeafDetection } from "@/src/features/disease-detection/api/disease-detection.api";
import type { CardStyleProps, ImageSize } from "./predict.types";
import { IMAGE_DISPLAY_WIDTH, scaleBox, commonShadow } from "./predict.utils";

type LeafDetectionViewProps = CardStyleProps & {
  palette: { primary: string; text: string; textGray?: string };
  imageUri: string;
  detections: LeafDetection[];
  imageSize: ImageSize;
  displayImageHeight: number;
  selectedLeafIndex: number | null;
  isDetecting: boolean;
  onSelectLeaf: (index: number) => void;
};

export default function LeafDetectionView({
  cardBg,
  borderColor,
  palette,
  imageUri,
  detections,
  imageSize,
  displayImageHeight,
  selectedLeafIndex,
  isDetecting,
  onSelectLeaf,
}: LeafDetectionViewProps) {
  const { t } = useTranslation();

  return (
    <View
      style={[
        {
          backgroundColor: cardBg,
          borderColor,
          borderWidth: 1,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 16,
        },
        commonShadow,
      ]}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: imageUri }}
          style={{
            width: IMAGE_DISPLAY_WIDTH,
            height: Math.min(displayImageHeight, 250),
          }}
          resizeMode="contain"
        />
        {/* Bounding boxes */}
        {detections.map((det, idx) => {
          const containerH = Math.min(displayImageHeight, 250);
          const box = scaleBox(det.boundingBox, imageSize, containerH);
          const isSelected = selectedLeafIndex === idx;
          return (
            <Pressable
              key={idx}
              onPress={() => onSelectLeaf(idx)}
              style={{
                position: "absolute",
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
                borderWidth: isSelected ? 3 : 2,
                borderColor: isSelected ? palette.primary : "#4ADE80",
                borderRadius: 4,
                backgroundColor: isSelected
                  ? `${palette.primary}20`
                  : "transparent",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: -18,
                  left: -1,
                  backgroundColor: isSelected ? palette.primary : "#4ADE80",
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 10,
                    fontWeight: "700",
                  }}
                >
                  {t("diseaseDetection.leafItem", "Leaf {{num}}", {
                    num: idx + 1,
                  })}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* Loading overlay */}
        {isDetecting && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
            }}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text
              style={{
                color: "#FFF",
                fontWeight: "600",
                marginTop: 8,
                fontSize: 14,
              }}
            >
              {t("diseaseDetection.detecting", "Detecting leaves...")}
            </Text>
          </View>
        )}
      </View>

      {/* Detection summary */}
      {!isDetecting && (
        <View style={{ padding: 12 }}>
          <Text
            style={{
              color: palette.text,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {detections.length > 0
              ? t(
                  "diseaseDetection.leavesFound",
                  "{{count}} leaf(es) detected. Tap one to analyze.",
                  { count: detections.length },
                )
              : t(
                  "diseaseDetection.noLeaves",
                  "No leaves detected. Try a clearer photo.",
                )}
          </Text>
        </View>
      )}
    </View>
  );
}
