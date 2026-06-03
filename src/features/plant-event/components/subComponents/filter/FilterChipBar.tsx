import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SlidersHorizontal, X } from "lucide-react-native";

type ActiveChip = {
  key: string;
  label: string;
  onClear: () => void;
};

interface FilterChipBarProps {
  totalActive: number;
  chips: ActiveChip[];
  primaryColor: string;
  onToggle: () => void;
  onClearAll: () => void;
  expanded: boolean;
  t: (key: string, options?: any) => string;
}

export function FilterChipBar({
  totalActive,
  chips,
  primaryColor,
  onToggle,
  onClearAll,
  expanded,
  t,
}: FilterChipBarProps) {
  return (
    <Pressable
      className="flex-row items-center justify-between px-3 py-2.5"
      onPress={onToggle}
    >
      <View className="flex-row items-center gap-2 flex-1">
        <SlidersHorizontal
          size={14}
          color={totalActive > 0 ? primaryColor : "#94a3b8"}
        />
        <Text
          className="text-xs font-semibold"
          style={{ color: totalActive > 0 ? primaryColor : "#64748b" }}
        >
          {totalActive > 0
            ? `${totalActive} ${t("calendar.filter.active", { count: totalActive })}`
            : t("calendar.filter.button")}
        </Text>

        {/* Inline chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1 ml-2"
          contentContainerStyle={{ gap: 4, alignItems: "center" }}
        >
          {chips.map((chip) => (
            <Pressable
              key={chip.key}
              onPress={(e) => {
                e.stopPropagation();
                chip.onClear();
              }}
              className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
              style={{ backgroundColor: primaryColor + "18" }}
            >
              <Text
                className="text-[10px] font-semibold"
                style={{ color: primaryColor }}
              >
                {chip.label}
              </Text>
              <X size={8} color={primaryColor} />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="ml-2 flex-row items-center gap-1">
        {totalActive > 0 && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onClearAll();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-[10px] font-semibold text-red-500">
              {t("calendar.filter.clearAll", "Xóa")}
            </Text>
          </Pressable>
        )}
        <Text className="text-slate-400 dark:text-slate-500">
          {expanded ? "▼" : "▶"}
        </Text>
      </View>
    </Pressable>
  );
}
