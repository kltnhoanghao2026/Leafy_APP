import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function MonitorScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-gray-500">
        {t("mainNav.headers.diagnosis")}
      </Text>
    </View>
  );
}
