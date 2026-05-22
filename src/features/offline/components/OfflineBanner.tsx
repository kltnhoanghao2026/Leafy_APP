import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNetworkContext } from '@/src/providers/NetworkProvider';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';

export function OfflineBanner() {
  const { t } = useTranslation();
  const { toggleForceOffline } = useNetworkContext();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <View className="flex-row items-center justify-between bg-amber-100 px-4 py-3 dark:bg-amber-900/30">
      <View className="flex-row items-center flex-1">
        <WifiOff size={18} color="#D97706" />
        <Text className="ml-2 flex-shrink text-sm font-medium text-amber-800 dark:text-amber-500">
          {t('offline.readOnlyNotice', 'You are in offline mode. Data is read-only.')}
        </Text>
      </View>
    </View>
  );
}
