import { View, Text } from "react-native";

export function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <View className="mr-4 mb-2 min-w-[120px]">
      <Text className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </Text>
      <Text className="mt-0.5 text-sm font-semibold text-slate-800">
        {value}
      </Text>
    </View>
  );
}
