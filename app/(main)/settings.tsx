import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Colors from "@/src/constants/Colors";
import { useAuthContext } from "@/src/features/auth";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { logoutLocal } = useAuthContext();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (isLoggingOut) {
      return;
    }

    Alert.alert(
      t("screens.settings.confirmTitle"),
      t("screens.settings.confirmMessage"),
      [
        { text: t("screens.settings.cancel"), style: "cancel" },
        {
          text: t("screens.settings.logout"),
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await logoutLocal();
            } catch {
              Alert.alert(
                t("screens.settings.errorTitle"),
                t("screens.settings.errorMessage"),
              );
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: palette.background }}
    >
      <Text className="text-lg font-semibold" style={{ color: palette.text }}>
        {t("screens.settings.title")}
      </Text>

      <Pressable
        onPress={handleLogout}
        disabled={isLoggingOut}
        className="mt-6 w-full rounded-xl px-5 py-4"
        style={{
          backgroundColor: palette.green,
          opacity: isLoggingOut ? 0.6 : 1,
        }}
      >
        <Text className="text-center text-base font-semibold text-white">
          {isLoggingOut
            ? t("screens.settings.loggingOut")
            : t("screens.settings.logout")}
        </Text>
      </Pressable>
    </View>
  );
}
