import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type LoadingViewProps = {
  message?: string;
};

export function LoadingView({ message }: LoadingViewProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size="large" color="#10B981" />
      <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {message ?? t("common.loading")}
      </Text>
    </View>
  );
}
