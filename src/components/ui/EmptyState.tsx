import type { LucideIcon } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "@/src/hooks/useColorScheme";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#64748b" : "#94a3b8";
  return (
    <View className="flex-1 items-center justify-center py-12">
      <Icon
        size={48}
        color={iconColor}
        strokeWidth={1.5}
      />
      <Text className="mt-4 text-center text-[15px] font-semibold text-slate-500 dark:text-slate-400">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-[13px] text-slate-400 dark:text-slate-500">
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          className="mt-4 flex-row items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 shadow-sm"
        >
          <Text className="text-sm font-bold text-white">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
