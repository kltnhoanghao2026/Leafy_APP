import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import React from 'react';
import { Stack } from 'expo-router';

type ScreenConfig = {
  name: string;
  title: string;
  headerShown?: boolean;
};

// ── Layout ────────────────────────────────────────────────────────────────────

export default function IotLayout() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const screens: ScreenConfig[] = [
    { name: 'index', title: 'Thiết bị IoT' },
    { name: 'devices/[deviceId]/index', title: 'Chi tiết thiết bị' },
    { name: 'devices/[deviceId]/config', title: 'Cấu hình thiết bị' },
    { name: 'onboarding', title: 'Thêm thiết bị' },
    { name: 'qr-scan', title: 'Quét QR' },
    { name: 'dashboard', title: 'Tổng quan IoT' },
    { name: 'zones/[zoneId]', title: 'Số liệu khu vực' },
    { name: 'alerts', title: 'Cảnh báo IoT' },
    { name: 'alerts/[alertId]', title: 'Chi tiết cảnh báo' },
  ];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text, fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      {screens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            headerShown: screen.headerShown ?? false,
          }}
        />
      ))}
    </Stack>
  );
}
