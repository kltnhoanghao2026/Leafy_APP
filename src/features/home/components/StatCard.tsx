import React from "react";
import { View, Text } from "react-native";

export type StatCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  badge?: string;
  badgeColor?: string;
};

export function StatCard({
  icon,
  iconBg,
  label,
  value,
  badge,
  badgeColor,
}: StatCardProps) {
  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 w-full min-h-[120px] justify-between">
      <View className="flex-row justify-between items-start mb-2">
        <View className={`rounded-2xl p-2.5 ${iconBg}`}>
          {icon}
        </View>
        {badge ? (
          <Text className={`text-[11px] font-bold ${badgeColor}`}>{badge}</Text>
        ) : null}
      </View>
      <View>
        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</Text>
        <Text className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</Text>
      </View>
    </View>
  );
}
