import { BadgeCheck } from "lucide-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

import { CommunityPalette, Expert } from "./community.types";

type ExpertsCardProps = {
  experts: Expert[];
  palette: CommunityPalette;
  cardBg: string;
  lineColor: string;
  mutedText: string;
};

export function ExpertsCard({
  experts,
  palette,
  cardBg,
  lineColor,
  mutedText,
}: ExpertsCardProps) {
  return (
    <View
      className="rounded-xl p-5 shadow-sm"
      style={{
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor: lineColor,
      }}
    >
      <View className="mb-4 flex-row items-center gap-2">
        <BadgeCheck size={20} color={palette.primary} />
        <Text className="text-sm font-bold" style={{ color: palette.text }}>
          Chuyên gia trực tuyến
        </Text>
      </View>

      <View className="gap-4">
        {experts.map((expert) => (
          <View
            key={expert.id}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="relative">
                <Image
                  source={{ uri: expert.avatarUrl }}
                  className="h-10 w-10 rounded-full"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
              </View>
              <View>
                <Text
                  className="text-xs font-bold"
                  style={{ color: palette.text }}
                >
                  {expert.name}
                </Text>
                <Text className="text-[10px]" style={{ color: mutedText }}>
                  {expert.specialty}
                </Text>
              </View>
            </View>
            <Pressable>
              <Text
                className="text-[10px] font-bold uppercase"
                style={{ color: palette.primary }}
              >
                Nhắn tin
              </Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          className="mt-2 w-full items-center justify-center rounded-lg border py-2 transition-colors"
          style={{ borderColor: lineColor }}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: palette.primary }}
          >
            Xem tất cả chuyên gia
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
