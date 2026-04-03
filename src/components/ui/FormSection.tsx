import type { ReactNode } from "react";
import { Text, View } from "react-native";

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Text className="text-sm font-bold text-slate-900 dark:text-white mb-3">
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
