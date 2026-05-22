import React from "react";
import { View, Text, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { MotiView } from "moti";
import { Sparkles } from "lucide-react-native";

import type { PredictionResponse } from "@/src/features/disease-detection/api/disease-detection.api";
import type { CardStyleProps } from "./predict.types";
import {
  IMAGE_DISPLAY_WIDTH,
  getConfidenceColor,
  commonShadow,
} from "./predict.utils";

type PredictionResultCardProps = CardStyleProps & {
  palette: { primary: string; text: string; textGray?: string };
  scheme: "light" | "dark";
  result: PredictionResponse;
  croppedUri: string | null;
};

export default function PredictionResultCard({
  cardBg,
  borderColor,
  palette,
  scheme,
  result,
  croppedUri,
}: PredictionResultCardProps) {
  const { t } = useTranslation();

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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Sparkles size={20} color={palette.primary} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: palette.text,
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            {t("diseaseDetection.results", "Analysis Results")}
          </Text>
        </View>
        
        {result.modelName && (
          <Text
            style={{
              color: palette.textGray || "#64748B",
              fontSize: 13,
              marginBottom: 20,
              fontWeight: "500",
            }}
          >
            {t("diseaseDetection.model", "Model")}: {result.modelName}
            {result.processingTimeMs != null &&
              `  •  ${result.processingTimeMs.toFixed(0)}ms`}
          </Text>
        )}

        <View style={{ gap: 16 }}>
          {result.predictions.map((prediction, index) => {
            const confidenceColor = getConfidenceColor(prediction.confidenceScore);
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
                      fontSize: 15,
                      fontWeight: index === 0 ? "700" : "600",
                    }}
                  >
                    {prediction.className.replace(/_/g, " ")}
                  </Text>
                  <Text
                    style={{
                      color: index === 0 ? confidenceColor : (palette.textGray || "#64748B"),
                      fontSize: 15,
                      fontWeight: "800",
                    }}
                  >
                    {(prediction.confidenceScore * 100).toFixed(1)}%
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
                    animate={{ width: `${Math.round(prediction.confidenceScore * 100)}%` }}
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
      </View>
    </MotiView>
  );
}
