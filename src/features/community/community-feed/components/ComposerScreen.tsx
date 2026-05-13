import {
  ChevronDown,
  Eye,
  Globe,
  ImagePlus,
  Lock,
  MapPin,
  Send,
  Users,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { useTranslation } from "react-i18next";

import type { PostVisibility } from "./community.types";
import { useComposerScreen } from "./useComposerScreen";

const VISIBILITY_OPTIONS: {
  value: PostVisibility;
  labelKey: string;
  icon: typeof Globe;
}[] = [
  { value: "ALL", labelKey: "community.composer.visibilityAll", icon: Globe },
  {
    value: "FRIEND",
    labelKey: "community.composer.visibilityFriend",
    icon: Users,
  },
  {
    value: "ONLY_ME",
    labelKey: "community.composer.visibilityOnlyMe",
    icon: Lock,
  },
];

export function ComposerScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const {
    caption,
    setCaption,
    media,
    visibility,
    setVisibility,
    isSubmitting,
    canPost,
    pickMedia,
    removeMedia,
    submitPost,
    displayName,
    avatarUri,
    avatarLetter,
    shouldShowLetterAvatar,
    setIsAvatarError,
  } = useComposerScreen();

  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);

  const cardBg = colorScheme === "dark" ? "#1F2A20" : "#FFFFFF";
  const softBg = colorScheme === "dark" ? "rgba(47,127,52,0.16)" : "#F2F7F2";
  const lineColor =
    colorScheme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(47,127,52,0.12)";

  const currentVisibility =
    VISIBILITY_OPTIONS.find((o) => o.value === visibility) ??
    VISIBILITY_OPTIONS[0];
  const VisibilityIcon = currentVisibility.icon;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: cardBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header: Avatar, Name, Visibility, and Post Button */}
        <View className="mb-4 flex-row items-start justify-between">
          <View className="flex-row gap-3 flex-1">
            <View className="h-11 w-11 overflow-hidden rounded-full bg-primary/10">
              {shouldShowLetterAvatar ? (
                <View className="h-full w-full items-center justify-center">
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

            <View className="justify-center">
              <Text
                className="text-[15px] font-bold"
                style={{ color: palette.text }}
              >
                {displayName}
              </Text>
              <Pressable
                className="mt-1 flex-row items-center gap-1 self-start rounded border px-2 py-0.5"
                style={{ borderColor: lineColor, backgroundColor: softBg }}
                onPress={() => setShowVisibilityPicker(true)}
              >
                <VisibilityIcon
                  size={12}
                  color={palette.textGray || "#64748B"}
                />
                <Text
                  className="text-[12px] font-medium"
                  style={{ color: palette.textGray || "#64748B" }}
                >
                  {t(currentVisibility.labelKey)}
                </Text>
                <ChevronDown size={12} color={palette.textGray || "#64748B"} />
              </Pressable>
            </View>
          </View>

          {/* Post Button in Header like Facebook/Twitter */}
          <Pressable
            className="flex-row items-center justify-center rounded-full px-5 py-1.5 self-start mt-0.5"
            style={{
              backgroundColor: canPost ? palette.primary : softBg,
            }}
            onPress={submitPost}
            disabled={!canPost || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                className="text-[13px] font-bold"
                style={{
                  color: canPost ? "#FFFFFF" : palette.textGray || "#9CA3AF",
                }}
              >
                {t("community.composer.post")}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Main Text Input */}
        <TextInput
          placeholder={t("community.composer.placeholder")}
          placeholderTextColor={palette.textInputPlaceholder}
          multiline
          value={caption}
          onChangeText={setCaption}
          editable={!isSubmitting}
          autoFocus={true}
          className="min-h-[120px] text-[16px]"
          style={{
            color: palette.text,
            textAlignVertical: "top",
          }}
        />

        {/* Media Grid / Preview */}
        {media.length > 0 && (
          <View className="mt-4 flex-row flex-wrap gap-[2%]">
            {media.map((asset, index) => {
              // Dynamic widths based on the number of media items
              const isSingle = media.length === 1;
              const isDouble = media.length === 2;

              const containerStyle = isSingle
                ? { width: "100%", height: 260 }
                : isDouble
                  ? { width: "48%", height: 180, marginBottom: 8 }
                  : { width: "31.5%", height: 120, marginBottom: 8 };

              return (
                <View
                  key={`${asset.uri}-${index}`}
                  style={containerStyle as any}
                  className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
                >
                  <Image
                    source={{ uri: asset.uri }}
                    className="h-full w-full rounded-xl"
                    resizeMode="cover"
                  />
                  <Pressable
                    className="absolute right-2 top-2 rounded-full p-1.5"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    onPress={() => removeMedia(index)}
                    disabled={isSubmitting}
                  >
                    <X size={16} color="#FFFFFF" />
                  </Pressable>
                  {asset.type === "video" && (
                    <View className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1">
                      <Text className="text-[10px] font-bold tracking-wider text-white">
                        VIDEO
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Toolbar fixed above keyboard */}
      <View
        className="flex-row items-center border-t px-4 py-3"
        style={{ borderColor: lineColor, backgroundColor: cardBg, paddingBottom: 12 }}
      >
        <View className="flex-row items-center gap-5">
          <Pressable
            onPress={pickMedia}
            disabled={isSubmitting}
            hitSlop={8}
            className={isSubmitting ? "opacity-50" : "opacity-100"}
          >
            <ImagePlus size={24} color={palette.primary} />
          </Pressable>
          <Pressable hitSlop={8}>
            <MapPin size={24} color={palette.primary} />
          </Pressable>
        </View>
      </View>

      {/* Visibility Picker Modal */}
      <Modal
        visible={showVisibilityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVisibilityPicker(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setShowVisibilityPicker(false)}
        >
          <View
            className="w-full max-w-[320px] rounded-2xl p-5"
            style={{ backgroundColor: cardBg }}
            onStartShouldSetResponder={() => true}
          >
            <View
              className="mb-4 flex-row items-center gap-2 border-b pb-3"
              style={{ borderColor: lineColor }}
            >
              <Eye size={20} color={palette.text} />
              <Text
                className="text-lg font-bold"
                style={{ color: palette.text }}
              >
                {t("community.composer.visibility")}
              </Text>
            </View>

            <View className="gap-2">
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = visibility === option.value;
                return (
                  <Pressable
                    key={option.value}
                    className="flex-row items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: isSelected ? softBg : "transparent",
                    }}
                    onPress={() => {
                      setVisibility(option.value);
                      setShowVisibilityPicker(false);
                    }}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? palette.primary : palette.text}
                    />
                    <Text
                      className="flex-1 text-base font-medium"
                      style={{
                        color: isSelected ? palette.primary : palette.text,
                      }}
                    >
                      {t(option.labelKey)}
                    </Text>
                    {isSelected && (
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: palette.primary }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
