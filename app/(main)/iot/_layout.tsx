import { Stack, useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { Pressable, View } from "react-native";

import BackButton from "@/src/components/ui/BackButton";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

function HeaderNotificationButton() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  return (
    <Pressable
      accessibilityLabel="Notifications"
      accessibilityRole="button"
      onPress={() => router.push("/(main)/notifications" as never)}
      style={{
        alignItems: "center",
        backgroundColor: scheme === "dark" ? "#1E293B" : "#F1F5F9",
        borderRadius: 999,
        height: 40,
        justifyContent: "center",
        width: 40,
      }}
    >
      <Bell color={palette.primary} size={20} />
    </Pressable>
  );
}

export default function IotLayout() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTitleAlign: "center",
        headerTitleStyle: { color: palette.text, fontWeight: "700" },
        headerShadowVisible: false,
        headerLeft: () => <BackButton fallback="/(main)/iot" />,
        headerRight: () => <HeaderNotificationButton />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerLeft: () => <View style={{ width: 40 }} />,
          headerTitle: "Thiết bị IoT",
        }}
      />
      <Stack.Screen
        name="devices/[deviceId]/index"
        options={{
          headerTitle: "Chi tiết thiết bị",
        }}
      />
      <Stack.Screen
        name="devices/[deviceId]/config"
        options={{
          headerTitle: "Cấu hình thiết bị",
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerTitle: "Thêm thiết bị",
        }}
      />
      <Stack.Screen
        name="qr-scan"
        options={{
          headerTitle: "Quét QR",
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          headerTitle: "Tổng quan IoT",
        }}
      />
      <Stack.Screen
        name="camera-schedules"
        options={{
          headerTitle: "Quản lý kế hoạch",
        }}
      />
      <Stack.Screen
        name="zones/[zoneId]"
        options={{
          headerTitle: "Biểu đồ telemetry",
        }}
      />
      <Stack.Screen
        name="alerts"
        options={{
          headerTitle: "Cảnh báo thiết bị",
        }}
      />
      <Stack.Screen
        name="alerts/rules"
        options={{
          headerTitle: "Quy tắc cảnh báo",
        }}
      />
      <Stack.Screen
        name="alerts/[alertId]"
        options={{
          headerTitle: "Chi tiết cảnh báo",
        }}
      />
    </Stack>
  );
}
