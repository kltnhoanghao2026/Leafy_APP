import React from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Check, ChevronRight, ScanLine, Sprout } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { MotiView, AnimatePresence } from "moti";

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
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 90 }}
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: `${borderColor}80`,
        }}
      >
        <Sprout size={20} color={palette.primary} style={{ marginRight: 10 }} />
        <Text
          style={{
            color: palette.text,
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          {t("diseaseDetection.detectedLeaves", "Detected Leaves")}
        </Text>
      </View>
      
      {detections.map((det, idx) => {
        const isSelected = selectedLeafIndex === idx;
        
        return (
          <View key={idx}>
            <TouchableOpacity
              onPress={() => onSelectLeaf(idx)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: idx < detections.length - 1 && !isSelected ? 1 : 0,
                borderBottomColor: borderColor,
                backgroundColor: isSelected
                  ? `${palette.primary}15`
                  : "transparent",
              }}
            >
              <MotiView
                animate={{
                  backgroundColor: isSelected
                    ? palette.primary
                    : `${palette.primary}15`,
                  scale: isSelected ? 1.1 : 1,
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                {isSelected ? (
                  <Check size={18} color="#FFF" strokeWidth={3} />
                ) : (
                  <Text
                    style={{
                      color: palette.primary,
                      fontWeight: "800",
                      fontSize: 14,
                    }}
                  >
                    {idx + 1}
                  </Text>
                )}
              </MotiView>
              
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: isSelected ? palette.primary : palette.text,
                    fontSize: 15,
                    fontWeight: isSelected ? "700" : "600",
                    marginBottom: 2,
                  }}
                >
                  {t("diseaseDetection.leafItem", "Leaf {{num}}", {
                    num: idx + 1,
                  })}
                </Text>
                <Text
                  style={{
                    color: palette.textGray || "#64748B",
                    fontSize: 13,
                  }}
                >
                  {t("diseaseDetection.confidence", "Confidence")}:{" "}
                  <Text style={{ fontWeight: "600", color: palette.text }}>
                    {(det.confidenceScore * 100).toFixed(1)}%
                  </Text>
                </Text>
              </View>
              
              <MotiView
                animate={{
                  rotate: isSelected ? "90deg" : "0deg",
                  scale: isSelected ? 1.2 : 1,
                }}
              >
                <ChevronRight
                  size={20}
                  color={isSelected ? palette.primary : (palette.textGray || "#94A3B8")}
                />
              </MotiView>
            </TouchableOpacity>

            {/* Inline Action Area when Selected */}
            <AnimatePresence>
              {isSelected && croppedUri && (
                <MotiView
                  from={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <View
                    style={{
                      backgroundColor: `${palette.primary}08`,
                      padding: 20,
                      borderBottomWidth: idx < detections.length - 1 ? 1 : 0,
                      borderBottomColor: borderColor,
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
                          width: 88,
                          height: 88,
                          borderRadius: 16,
                          overflow: "hidden",
                          borderWidth: 2,
                          borderColor: `${palette.primary}40`,
                          backgroundColor: palette.background || "#F8FAFC",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                        }}
                      >
                        <Image
                          source={{ uri: croppedUri }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      </View>
                      
                      <TouchableOpacity
                        onPress={onPredict}
                        disabled={isPredicting}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isPredicting
                            ? `${palette.primary}80`
                            : palette.primary,
                          borderRadius: 16,
                          paddingVertical: 16,
                          gap: 10,
                          shadowColor: palette.primary,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                      >
                        {isPredicting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <ScanLine size={20} color="#FFFFFF" />
                        )}
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontWeight: "700",
                            fontSize: 16,
                          }}
                        >
                          {isPredicting
                            ? t("diseaseDetection.analyzing", "Analyzing...")
                            : t("diseaseDetection.predictDisease", "Analyze Leaf")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </MotiView>
              )}
            </AnimatePresence>
          </View>
        );
      })}
    </MotiView>
  );
}
