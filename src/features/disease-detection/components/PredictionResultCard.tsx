import React from "react";
import { View, Text, Image } from "react-native";
import { useTranslation } from "react-i18next";

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
    <>
      {croppedUri && (
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
          <Image
            source={{ uri: croppedUri }}
            style={{ width: IMAGE_DISPLAY_WIDTH, height: 200 }}
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
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          },
          commonShadow,
        ]}
      >
        <Text
          style={{
            color: palette.text,
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 4,
          }}
        >
          {t("diseaseDetection.results", "Analysis Results")}
        </Text>
        {result.modelName && (
          <Text
            style={{
              color: palette.textGray || "#64748B",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {t("diseaseDetection.model", "Model")}: {result.modelName}
            {result.processingTimeMs != null &&
              `  •  ${result.processingTimeMs.toFixed(0)}ms`}
          </Text>
        )}

        {result.predictions.map((prediction, index) => (
          <View
            key={`${prediction.className}-${index}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopColor: borderColor,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: palette.text,
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                }}
              >
                {prediction.className.replace(/_/g, " ")}
              </Text>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    scheme === "dark" ? "rgba(71,85,105,0.3)" : "#E2E8F0",
                }}
              >
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    width: `${Math.round(prediction.confidenceScore * 100)}%`,
                    backgroundColor: getConfidenceColor(
                      prediction.confidenceScore,
                    ),
                  }}
                />
              </View>
            </View>
            <Text
              style={{
                color: getConfidenceColor(prediction.confidenceScore),
                fontSize: 15,
                fontWeight: "700",
                marginLeft: 16,
                minWidth: 52,
                textAlign: "right",
              }}
            >
              {(prediction.confidenceScore * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}
