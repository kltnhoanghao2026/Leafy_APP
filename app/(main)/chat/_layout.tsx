import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import BackButton from '@/src/components/ui/BackButton';

export default function ChatLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.background,
        },
        headerTitleStyle: {
          color: palette.text,
          fontWeight: "600",
        },
        headerTintColor: palette.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerTitle: "Tin nhắn",
          headerLeft: () => <BackButton fallback="/(main)" />,
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerTitle: "Trò chuyện",
          headerLeft: () => <BackButton fallback="/(main)/chat" />,
        }} 
      />
      <Stack.Screen 
        name="new-dm" 
        options={{ 
          headerTitle: "Tin nhắn mới",
          headerLeft: () => <BackButton fallback="/(main)/chat" />,
        }} 
      />
      <Stack.Screen 
        name="new-group" 
        options={{ 
          headerTitle: "Tạo nhóm mới",
          headerLeft: () => <BackButton fallback="/(main)/chat" />,
        }} 
      />
      <Stack.Screen 
        name="info/index" 
        options={{ 
          headerTitle: "Thông tin",
          headerLeft: () => <BackButton fallback="/(main)/chat" />,
        }} 
      />
      <Stack.Screen 
        name="info/members" 
        options={{ 
          headerTitle: "Thành viên",
          headerLeft: () => <BackButton fallback="/(main)/chat/info" />,
        }} 
      />
      <Stack.Screen 
        name="info/add-member" 
        options={{ 
          headerTitle: "Thêm thành viên",
          headerLeft: () => <BackButton fallback="/(main)/chat/info/members" />,
        }} 
      />
      <Stack.Screen 
        name="info/join-requests" 
        options={{ 
          headerTitle: "Yêu cầu tham gia",
          headerLeft: () => <BackButton fallback="/(main)/chat/info" />,
        }} 
      />
      <Stack.Screen 
        name="info/media" 
        options={{ 
          headerTitle: "Ảnh & Video",
          headerLeft: () => <BackButton fallback="/(main)/chat/info" />,
        }} 
      />
      <Stack.Screen 
        name="info/files" 
        options={{ 
          headerTitle: "Tệp đính kèm",
          headerLeft: () => <BackButton fallback="/(main)/chat/info" />,
        }} 
      />
      <Stack.Screen 
        name="info/pinned" 
        options={{ 
          headerTitle: "Tin nhắn được ghim",
          headerLeft: () => <BackButton fallback="/(main)/chat/info" />,
        }} 
      />
      <Stack.Screen 
        name="info/settings" 
        options={{ 
          headerTitle: "Cài đặt nhóm",
          headerLeft: () => <BackButton fallback="/(main)/chat/info" />,
        }} 
      />
      <Stack.Screen 
        name="info/blocked" 
        options={{ 
          headerTitle: "Thành viên bị chặn",
          headerLeft: () => <BackButton fallback="/(main)/chat/info" />,
        }} 
      />
    </Stack>
  );
}
