import { View, Text } from "react-native";

export function BatteryBar({ percentage }: { percentage: number }) {
  let fillColor = "bg-[#10B981] dark:bg-emerald-500";
  if (percentage <= 20) fillColor = "bg-[#CBD5E1] dark:bg-slate-500";
  else if (percentage <= 50) fillColor = "bg-[#F59E0B] dark:bg-amber-500";

  return (
    <View>
      <View className="w-[70px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-0.5">
        <View
          className={`h-full rounded-full ${fillColor}`}
          style={{ width: `${percentage}%` }}
        />
      </View>
      <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
        {percentage}%
      </Text>
    </View>
  );
}
