import { useRouter } from "expo-router";
import { Edit3 } from "lucide-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

import { CommunityPalette } from "./community.types";
import { useComposerAvatar } from "./useComposerAvatar";

type ComposerCardProps = {
  palette: CommunityPalette;
  cardBg: string;
  lineColor: string;
};

export function ComposerCard({
  palette,
  cardBg,
  lineColor,
}: ComposerCardProps) {
  const router = useRouter();
  const { avatarUri, avatarLetter, shouldShowLetterAvatar, setIsAvatarError } =
    useComposerAvatar();

  return (
    <View
      className="rounded-xl px-4 py-3 shadow-sm"
      style={{
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor: lineColor,
      }}
    >
      <Pressable
        className="flex-row items-center gap-3"
        onPress={() => router.push("/composer")}
      >
        <View className="h-11 w-11 overflow-hidden rounded-full border border-primary/15">
          {shouldShowLetterAvatar ? (
            <View className="h-full w-full items-center justify-center bg-primary/20">
              <Text className="text-lg font-bold uppercase text-primary">
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
        <View
          className="flex-1 flex-row items-center justify-between rounded-full px-4 py-3"
          style={{ backgroundColor: "rgba(47,127,52,0.10)" }}
        >
          <Text
            className="text-sm"
            style={{ color: palette.textInputPlaceholder }}
          >
            Chia sẻ tình trạng vườn của bạn...
          </Text>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/15">
            <Edit3 size={16} color={palette.primary} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}
