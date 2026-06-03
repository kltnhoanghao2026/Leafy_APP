import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Camera, ImagePlus, UploadCloud } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { MotiView } from "moti";

import type { CardStyleProps } from "./predict.types";
import { commonShadow } from "./predict.utils";

type ImagePickerCardProps = CardStyleProps & {
  palette: { primary: string; text: string; textGray?: string; background?: string };
  onPickGallery: () => void;
  onTakePhoto: () => void;
  hideGallery?: boolean;
};

export default function ImagePickerCard({
  cardBg,
  borderColor,
  palette,
  onPickGallery,
  onTakePhoto,
  hideGallery = false,
}: ImagePickerCardProps) {
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
          padding: 24,
          alignItems: "center",
          marginBottom: 20,
        },
        commonShadow,
      ]}
    >
      <View
        style={{
          width: "100%",
          borderWidth: 2,
          borderColor: `${palette.primary}40`,
          borderStyle: "dashed",
          borderRadius: 20,
          backgroundColor: `${palette.primary}05`,
          padding: 32,
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${palette.primary}15`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <UploadCloud size={40} color={palette.primary} />
        </View>
        <Text
          style={{
            color: palette.text,
            fontSize: 18,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          {t("diseaseDetection.selectImage", "Upload Leaf Image")}
        </Text>
        <Text
          style={{
            color: palette.textGray || "#64748B",
            fontSize: 14,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          {t(
            "diseaseDetection.selectImageHint",
            "Choose a clear photo of the affected leaf for the best results.",
          )}
        </Text>
      </View>

      <View style={{ flexDirection: "column", gap: 16, width: "100%" }}>
        {!hideGallery && (
          <TouchableOpacity
            onPress={onPickGallery}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${palette.primary}10`,
              borderRadius: 16,
              paddingVertical: 18,
              gap: 12,
            }}
          >
            <ImagePlus size={22} color={palette.primary} />
            <Text
              style={{
                color: palette.primary,
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              {t("diseaseDetection.gallery", "Choose from Gallery")}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onTakePhoto}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: palette.primary,
            borderRadius: 16,
            paddingVertical: 18,
            gap: 12,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Camera size={22} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
            {t("diseaseDetection.camera", "Take a Photo")}
          </Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}
