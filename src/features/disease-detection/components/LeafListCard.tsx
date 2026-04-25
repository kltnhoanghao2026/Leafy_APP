import React from "react";
import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { Check, ChevronRight, ScanLine } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import type { LeafDetection } from "@/src/features/disease-detection/api/disease-detection.api";
import type { CardStyleProps } from "./predict.types";
import { commonShadow } from "./predict.utils";

type LeafListCardProps = CardStyleProps & {
  palette: {
    primary: string;
    text: string;
    textGray?: string;
    background?: string;
  };
  detections: LeafDetection[];
  selectedLeafIndex: number | null;
  onSelectLeaf: (index: number) => void;
  croppedUri: string | null;
  isPredicting: boolean;
  onPredict: () => void;
};

export default function LeafListCard({
  cardBg,
  borderColor,
  palette,
  detections,
  selectedLeafIndex,
  onSelectLeaf,
  croppedUri,
  isPredicting,
  onPredict,
}: LeafListCardProps) {
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
      <Text
        style={{
          color: palette.text,
          fontSize: 14,
          fontWeight: "700",
          padding: 12,
          paddingBottom: 4,
        }}
      >
        {t("diseaseDetection.detectedLeaves", "Detected Leaves")}
      </Text>
      {detections.map((det, idx) => {
        const isSelected = selectedLeafIndex === idx;
        return (
          <View key={idx}>
            <Pressable
              onPress={() => onSelectLeaf(idx)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: borderColor,
                backgroundColor: isSelected
                  ? `${palette.primary}10`
                  : "transparent",
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isSelected
                    ? palette.primary
                    : `${palette.primary}15`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {isSelected ? (
                  <Check size={16} color="#FFF" strokeWidth={3} />
                ) : (
                  <Text
                    style={{
                      color: palette.primary,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {idx + 1}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: palette.text,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {t("diseaseDetection.leafItem", "Leaf {{num}}", {
                    num: idx + 1,
                  })}
                </Text>
                <Text
                  style={{
                    color: palette.textGray || "#64748B",
                    fontSize: 12,
                  }}
                >
                  {t("diseaseDetection.confidence", "Confidence")}:{" "}
                  {(det.confidenceScore * 100).toFixed(1)}%
                </Text>
              </View>
              <ChevronRight
                size={18}
                color={palette.textGray || "#94A3B8"}
                style={{
                  transform: [{ rotate: isSelected ? "90deg" : "0deg" }],
                }}
              />
            </Pressable>

            {/* Inline Action Area when Selected */}
            {isSelected && croppedUri && (
              <View
                style={{
                  backgroundColor: `${palette.primary}05`,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: borderColor,
                      backgroundColor: palette.background || "#F8FAFC",
                    }}
                  >
                    <Image
                      source={{ uri: croppedUri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>
                  <Pressable
                    onPress={onPredict}
                    disabled={isPredicting}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isPredicting
                        ? `${palette.primary}80`
                        : palette.primary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      gap: 8,
                    }}
                  >
                    {isPredicting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ScanLine size={18} color="#FFFFFF" />
                    )}
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      {isPredicting
                        ? t("diseaseDetection.analyzing", "Analyzing...")
                        : t("diseaseDetection.predictDisease", "Analyze Leaf")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
