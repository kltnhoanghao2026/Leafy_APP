import React from "react";
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { MotiView, AnimatePresence } from "moti";
import { ScanLine } from "lucide-react-native";

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
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 300 }}
      style={[
        {
          backgroundColor: cardBg,
          borderColor,
          borderWidth: 1,
          borderRadius: 24,
          overflow: "hidden",
          marginBottom: 20,
        },
        commonShadow,
      ]}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: imageUri }}
          style={{
            width: IMAGE_DISPLAY_WIDTH,
            height: Math.min(displayImageHeight, 300),
          }}
          resizeMode="contain"
        />
        
        {/* Dark overlay when a leaf is selected to focus on it */}
        {selectedLeafIndex !== null && !isDetecting && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "#000",
            }}
            pointerEvents="none"
          />
        )}

        {/* Bounding boxes */}
        {detections.map((det, idx) => {
          const containerH = Math.min(displayImageHeight, 300);
          const box = scaleBox(det.boundingBox, imageSize, containerH);
          const isSelected = selectedLeafIndex === idx;
          const isFaded = selectedLeafIndex !== null && !isSelected;

          return (
            <MotiView
              key={idx}
              animate={{
                opacity: isFaded ? 0.3 : 1,
                scale: isSelected ? 1.05 : 1,
                zIndex: isSelected ? 10 : 1,
              }}
              transition={{ type: "spring", damping: 15, stiffness: 120 }}
              style={{
                position: "absolute",
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
              }}
            >
              <Pressable
                onPress={() => onSelectLeaf(idx)}
                style={{ flex: 1 }}
              >
                <MotiView
                  animate={{
                    borderWidth: isSelected ? 3 : 2,
                    borderColor: isSelected ? palette.primary : "#4ADE80",
                    backgroundColor: isSelected ? `${palette.primary}30` : "transparent",
                    shadowColor: isSelected ? palette.primary : "transparent",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSelected ? 0.5 : 0,
                    shadowRadius: 10,
                  }}
                  style={{
                    flex: 1,
                    borderRadius: 8,
                  }}
                />
                
                <MotiView
                  animate={{
                    backgroundColor: isSelected ? palette.primary : "#4ADE80",
                    scale: isSelected ? 1.1 : 1,
                  }}
                  style={{
                    position: "absolute",
                    top: -24,
                    left: -2,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    flexDirection: "row",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFF",
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    {t("diseaseDetection.leafItem", "Leaf {{num}}", {
                      num: idx + 1,
                    })}
                  </Text>
                </MotiView>
              </Pressable>
            </MotiView>
          );
        })}

        {/* Loading overlay */}
        <AnimatePresence>
          {isDetecting && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(0,0,0,0.6)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 100 }}
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: 24,
                  borderRadius: 20,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text
                  style={{
                    color: "#FFF",
                    fontWeight: "700",
                    marginTop: 16,
                    fontSize: 16,
                    letterSpacing: 0.5,
                  }}
                >
                  {t("diseaseDetection.detecting", "Detecting leaves...")}
                </Text>
              </MotiView>
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {/* Detection summary */}
      <AnimatePresence>
        {!isDetecting && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{ padding: 16, backgroundColor: `${palette.primary}08` }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <ScanLine size={20} color={palette.primary} />
              <Text
                style={{
                  color: palette.text,
                  fontSize: 15,
                  fontWeight: "600",
                  flex: 1,
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
          </MotiView>
        )}
      </AnimatePresence>
    </MotiView>
  );
}
