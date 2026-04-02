import { Flame } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { CommunityPalette, Topic } from "./community.types";

type HotTopicsCardProps = {
  topics: Topic[];
  palette: CommunityPalette;
  cardBg: string;
  lineColor: string;
  mutedText: string;
};

export function HotTopicsCard({
  topics,
  palette,
  cardBg,
  lineColor,
  mutedText,
}: HotTopicsCardProps) {
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
        <Flame size={20} color={palette.primary} />
        <Text className="text-sm font-bold" style={{ color: palette.text }}>
          Chủ đề hot
        </Text>
      </View>

      <View className="gap-4">
        {topics.map((topic) => (
          <Pressable key={topic.id} className="group">
            <Text
              className="text-xs font-bold"
              style={{ color: palette.primary }}
            >
              {topic.tag}
            </Text>
            <Text
              className="my-1 text-sm font-medium"
              style={{ color: palette.text }}
            >
              {topic.title}
            </Text>
            <Text className="text-[10px]" style={{ color: mutedText }}>
              {topic.audience}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
