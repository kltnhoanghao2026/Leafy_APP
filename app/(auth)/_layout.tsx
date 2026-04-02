import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen
        name="signup/verify-otp"
        options={{
          headerShown: true,
          headerTitleAlign: "center",
          headerTitle: t("auth.verifyOtp.title"),
          headerBackTitle: t("common.back"),
          headerTintColor: "#16a34a",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#f9fafb" },
        }}
      />
    </Stack>
  );
}
