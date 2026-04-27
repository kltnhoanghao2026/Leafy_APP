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
        name="devices/[deviceId]"
        options={{
          headerShown: false,
          title: "Chi tiết thiết bị",
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
    </Stack>
  );
}
