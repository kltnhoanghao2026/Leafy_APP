import { Stack } from "expo-router";

export default function IotLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Thiết bị IoT",
        }}
      />
      <Stack.Screen
        name="devices/[deviceId]/index"
        options={{
          headerShown: false,
          title: "Chi tiết thiết bị",
        }}
      />
      <Stack.Screen
        name="devices/[deviceId]/config"
        options={{
          headerShown: false,
          title: "Cấu hình thiết bị",
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          title: "Thêm thiết bị",
        }}
      />
      <Stack.Screen
        name="qr-scan"
        options={{
          headerShown: false,
          title: "Quét QR",
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
          title: "Tổng quan IoT",
        }}
      />
      <Stack.Screen
        name="camera-schedules"
        options={{
          headerShown: false,
          title: "Lịch camera",
        }}
      />
      <Stack.Screen
        name="zones/[zoneId]"
        options={{
          headerShown: false,
          title: "Số liệu khu vực",
        }}
      />
      <Stack.Screen
        name="alerts"
        options={{
          headerShown: false,
          title: "Cảnh báo IoT",
        }}
      />
      <Stack.Screen
        name="alerts/rules"
        options={{
          headerShown: false,
          title: "Quy tắc cảnh báo",
        }}
      />
      <Stack.Screen
        name="alerts/[alertId]"
        options={{
          headerShown: false,
          title: "Chi tiết cảnh báo",
        }}
      />
    </Stack>
  );
}
