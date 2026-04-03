import { Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

type ErrorAlertProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  const { t } = useTranslation();

  return (
    <View className="border border-red-500/35 rounded-xl px-3 py-2.5 bg-red-500/10">
      <Text className="text-red-700 dark:text-red-500 text-[13px] font-semibold">
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry}>
          <Text className="text-green-600 dark:text-green-400 mt-1.5 font-bold text-[13px]">
            {t("common.retry")}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
