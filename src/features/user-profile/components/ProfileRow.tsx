import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

type ProfileRowProps = {
  icon: React.ReactNode;
  iconBgClass: string;
  title: string;
  colorClass: string;
  divider?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
};

export function ProfileRow({
  icon,
  iconBgClass,
  title,
  colorClass,
  divider,
  onPress,
  rightElement,
}: ProfileRowProps) {
  return (
    <View
      className={
        divider ? "border-b border-gray-200 dark:border-slate-700/50" : ""
      }
    >
      <Pressable
        className="w-full flex-row items-center justify-between px-4 py-4 transition-colors active:bg-gray-100 dark:active:bg-slate-700"
        onPress={onPress}
      >
        <View className="flex-1 flex-row items-center gap-3">
          <View
            className={`h-9 w-9 items-center justify-center rounded-lg ${iconBgClass}`}
          >
            {icon}
          </View>
          <Text className={`text-[15px] font-medium ${colorClass}`}>
            {title}
          </Text>
        </View>
        {rightElement ? (
          rightElement
        ) : (
          <ChevronRight color="#94A3B8" size={18} />
        )}
      </Pressable>
    </View>
  );
}
