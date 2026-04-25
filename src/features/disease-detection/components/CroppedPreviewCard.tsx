import React from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { ScanLine } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import type { CardStyleProps } from "./predict.types";
import { IMAGE_DISPLAY_WIDTH } from "./predict.utils";

type CroppedPreviewCardProps = CardStyleProps & {
  palette: { primary: string };
  croppedUri: string;
  isPredicting: boolean;
  onPredict: () => void;
};

export default function CroppedPreviewCard({
  cardBg,
  borderColor,
  palette,
  croppedUri,
  isPredicting,
  onPredict,
}: CroppedPreviewCardProps) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderColor,
        borderWidth: 1,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <Image
        source={{ uri: croppedUri }}
        style={{
          width: IMAGE_DISPLAY_WIDTH,
          height: 200,
        }}
        resizeMode="contain"
      />
      <View style={{ padding: 12, gap: 10 }}>
        <Pressable
          onPress={onPredict}
          disabled={isPredicting}
          style={{
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
            <ScanLine size={20} color="#FFFFFF" />
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
              : t("diseaseDetection.predictDisease", "Predict Disease")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
