import React from "react";
import { View, Text, Pressable } from "react-native";
import { Camera, ImagePlus } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import type { CardStyleProps } from "./predict.types";
import { commonShadow } from "./predict.utils";

type ImagePickerCardProps = CardStyleProps & {
  palette: { primary: string; text: string; textGray?: string };
  onPickGallery: () => void;
  onTakePhoto: () => void;
};

export default function ImagePickerCard({
  cardBg,
  borderColor,
  palette,
  onPickGallery,
  onTakePhoto,
}: ImagePickerCardProps) {
  const { t } = useTranslation();

  return (
    <View
      style={[
        {
          backgroundColor: cardBg,
          borderColor,
          borderWidth: 1,
          borderRadius: 16,
          padding: 32,
          alignItems: "center",
          marginBottom: 16,
        },
        commonShadow,
      ]}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: `${palette.primary}10`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <ImagePlus size={40} color={palette.primary} />
      </View>
      <Text
        style={{
          color: palette.text,
          fontSize: 15,
          fontWeight: "600",
          marginBottom: 6,
        }}
      >
        {t("diseaseDetection.selectImage", "Select a leaf image")}
      </Text>
      <Text
        style={{
          color: palette.textGray || "#64748B",
          fontSize: 13,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        {t(
          "diseaseDetection.selectImageHint",
          "Choose from gallery or take a photo of the affected leaf.",
        )}
      </Text>
      <View style={{ flexDirection: "column", gap: 12, width: "100%" }}>
        <Pressable
          onPress={onPickGallery}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${palette.primary}10`,
            borderRadius: 14,
            paddingVertical: 16,
            gap: 12,
          }}
        >
          <ImagePlus size={22} color={palette.primary} />
          <Text
            style={{
              color: palette.primary,
              fontWeight: "700",
              fontSize: 15,
            }}
          >
            {t("diseaseDetection.gallery", "Choose from Gallery")}
          </Text>
        </Pressable>
        <Pressable
          onPress={onTakePhoto}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: palette.primary,
            borderRadius: 14,
            paddingVertical: 16,
            gap: 12,
          }}
        >
          <Camera size={22} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
            {t("diseaseDetection.camera", "Take a Photo")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
