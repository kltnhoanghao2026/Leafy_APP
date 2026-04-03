import type { ReactNode } from "react";
import { Text, View } from "react-native";

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <View>
      <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
        {label}
      </Text>
      {children}
      {error ? (
        <Text className="text-red-500 text-xs mt-1 font-semibold">{error}</Text>
      ) : null}
    </View>
  );
}
