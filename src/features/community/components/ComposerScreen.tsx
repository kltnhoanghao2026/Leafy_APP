import { ImagePlus, MapPin, Send } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { useTranslation } from "react-i18next";

import { useComposerAvatar } from "./useComposerAvatar";

export function ComposerScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const [content, setContent] = useState("");
  const { avatarUri, avatarLetter, shouldShowLetterAvatar, setIsAvatarError } =
    useComposerAvatar();

  const cardBg = colorScheme === "dark" ? "#1F2A20" : "#FFFFFF";
  const softBg = colorScheme === "dark" ? "rgba(47,127,52,0.16)" : "#F2F7F2";
  const lineColor =
    colorScheme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(47,127,52,0.12)";

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        className="rounded-xl px-4 py-4 shadow-sm"
        style={{
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor: lineColor,
        }}
      >
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 overflow-hidden rounded-full border border-primary/15">
            {shouldShowLetterAvatar ? (
              <View className="h-full w-full items-center justify-center bg-primary/20">
                <Text className="text-xl font-bold uppercase text-primary">
                  {avatarLetter}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: avatarUri }}
                className="h-full w-full"
                resizeMode="cover"
                onError={() => setIsAvatarError(true)}
              />
            )}
          </View>
          <View className="flex-1">
            <TextInput
              placeholder={t("community.composer.placeholder")}
              placeholderTextColor={palette.textInputPlaceholder}
              multiline
              value={content}
              onChangeText={setContent}
              className="min-h-[140px] rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: softBg,
                color: palette.text,
                textAlignVertical: "top",
              }}
            />

            <View className="mt-3 flex-row items-center gap-2">
              <Pressable
                className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
                style={{ backgroundColor: softBg }}
              >
                <ImagePlus size={18} color={palette.primary} />
                <Text
                  className="text-xs font-medium"
                  style={{ color: palette.primary }}
                >
                  {t("community.composer.photoVideo")}
                </Text>
              </Pressable>
              <Pressable
                className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
                style={{ backgroundColor: softBg }}
              >
                <MapPin size={18} color={palette.primary} />
                <Text
                  className="text-xs font-medium"
                  style={{ color: palette.primary }}
                >
                  {t("community.composer.location")}
                </Text>
              </Pressable>
            </View>

            <Pressable
              className="mt-4 flex-row items-center justify-center gap-2 rounded-full px-6 py-2.5"
              style={{ backgroundColor: palette.primary }}
            >
              <Send size={16} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">
                {t("community.composer.post")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
