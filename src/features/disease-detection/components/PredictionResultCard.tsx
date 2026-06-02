import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { MotiView } from "moti";
import { Sparkles, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react-native";

import type { PredictionResponse } from "@/src/features/disease-detection/api/disease-detection.api";
import type { CardStyleProps } from "./predict.types";
import {
  IMAGE_DISPLAY_WIDTH,
  getConfidenceColor,
  commonShadow,
  getDiseaseLabel,
  isHealthyDisease,
} from "./predict.utils";

type PredictionResultCardProps = CardStyleProps & {
  palette: { primary: string; text: string; textGray?: string };
  scheme: "light" | "dark";
  result: PredictionResponse;
  croppedUri: string | null;
  onGeneratePlan?: (diseaseName: string) => void;
  isGeneratingPlan?: boolean;
};

export default function PredictionResultCard({
  cardBg,
  borderColor,
  palette,
  scheme,
  result,
  croppedUri,
  onGeneratePlan,
  isGeneratingPlan = false,
}: PredictionResultCardProps) {
  const { t } = useTranslation();

  const predictions = [...(result.predictions ?? [])].sort(
    (a, b) => b.confidenceScore - a.confidenceScore
  );
  const topPrediction = predictions[0];
  const isHealthy = isHealthyDisease(topPrediction?.className);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 90 }}
    >
      {croppedUri && (
        <View
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
          <Image
            source={{ uri: croppedUri }}
            style={{ width: IMAGE_DISPLAY_WIDTH, height: 250 }}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Primary Result Card */}
      <View
        style={[
          {
            backgroundColor: cardBg,
            borderColor,
            borderWidth: 1,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
          },
          commonShadow,
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: isHealthy ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            {isHealthy ? (
              <CheckCircle size={22} color="#16A34A" strokeWidth={2.5} />
            ) : (
              <AlertTriangle size={22} color="#F59E0B" strokeWidth={2.5} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: palette.textGray || "#64748B",
                fontSize: 11,
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              {t("diseaseDetection.results", "Analysis Results")}
            </Text>
            <Text
              style={{
                color: palette.text,
                fontSize: 22,
                fontWeight: "900",
                marginTop: 2,
              }}
            >
              {getDiseaseLabel(topPrediction?.className)}
            </Text>
          </View>
        </View>

        {/* Diagnosis Status Banner */}
        <View
          style={{
            backgroundColor: isHealthy ? "rgba(22,163,74,0.06)" : "rgba(245,158,11,0.06)",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: isHealthy ? "rgba(22,163,74,0.12)" : "rgba(245,158,11,0.12)",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              lineHeight: 18,
              color: isHealthy ? "#15803D" : "#B45309",
            }}
          >
            {isHealthy
              ? t(
                  "diseaseDetection.healthyBanner",
                  "Lá cây có dấu hiệu khỏe mạnh. Tiếp tục theo dõi định kỳ."
                )
              : t(
                  "diseaseDetection.diseaseBanner",
                  "Phát hiện dấu hiệu bệnh. Kết quả chỉ mang tính hỗ trợ, cần kiểm tra thực tế trước khi xử lý."
                )}
          </Text>
        </View>

        {/* List of Predictions */}
        <View style={{ gap: 16 }}>
          {predictions.map((prediction, index) => {
            const confidenceColor = getConfidenceColor(prediction.confidenceScore);
            const percent = Math.round(prediction.confidenceScore * 100);

            return (
              <View
                key={`${prediction.className}-${index}`}
                style={{
                  paddingVertical: index > 0 ? 12 : 0,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: `${borderColor}60`,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text
                    style={{
                      color: palette.text,
                      fontSize: 14,
                      fontWeight: index === 0 ? "800" : "600",
                    }}
                  >
                    {getDiseaseLabel(prediction.className)}
                  </Text>
                  <Text
                    style={{
                      color: index === 0 ? confidenceColor : (palette.textGray || "#64748B"),
                      fontSize: 14,
                      fontWeight: "800",
                    }}
                  >
                    {percent}%
                  </Text>
                </View>
                
                <View
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      scheme === "dark" ? "rgba(71,85,105,0.3)" : "#E2E8F0",
                    overflow: "hidden",
                  }}
                >
                  <MotiView
                    from={{ width: "0%" }}
                    animate={{ width: `${percent}%` }}
                    transition={{ type: "timing", duration: 800, delay: index * 100 }}
                    style={{
                      height: "100%",
                      borderRadius: 4,
                      backgroundColor: confidenceColor,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Generate Treatment Plan CTA */}
        {!isHealthy && onGeneratePlan && (
          <TouchableOpacity
            onPress={() => onGeneratePlan(topPrediction.className)}
            disabled={isGeneratingPlan}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.primary,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 20,
              marginTop: 24,
              gap: 8,
              shadowColor: palette.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Sparkles size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              {isGeneratingPlan
                ? t("diseaseDetection.generatingPlan", "Đang tạo kế hoạch...")
                : t("diseaseDetection.generatePlan", "Tạo kế hoạch điều trị")}
            </Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Model Metadata */}
        <View
          style={{
            marginTop: 20,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: `${borderColor}60`,
          }}
        >
          <Text
            style={{
              color: palette.textGray || "#64748B",
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            {t("diseaseDetection.model", "Model")}: {result.modelName || "N/A"}
            {result.processingTimeMs != null &&
              `  •  ${result.processingTimeMs.toFixed(0)}ms`}
          </Text>
        </View>
      </View>
    </MotiView>
  );
}
