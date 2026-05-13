import React from 'react';
import { View, FlatList, ActivityIndicator, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOfflineFarms } from '../hooks/useOfflineQueries';
import { useAuthContext } from '@/src/features/auth';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { FarmPlotCard } from '@/src/features/farm/components/FarmPlotCard';
import { Map, AlertCircle } from 'lucide-react-native';
import { MotiView } from 'moti';

export function OfflineFarmList() {
  const { t, i18n } = useTranslation();
  const { profileId } = useAuthContext();
  const { data: farms, isLoading } = useOfflineFarms(profileId || undefined);
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const handlePress = () => {
    Alert.alert(
      t('offline.readOnly', 'Read Only Mode'),
      t('offline.actionDisabled', 'This action is unavailable while offline.')
    );
  };

  const formatArea = (m2: number) => {
    if (m2 >= 10000) return `${(m2 / 10000).toFixed(1)} ha`;
    return `${m2} m²`;
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : !farms || farms.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="items-center justify-center"
          >
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <Map size={40} color={palette.primary} />
            </View>
            <Text className="text-center text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              {t('offline.noFarmsTitle', 'No Farms Cached')}
            </Text>
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400 px-4">
              {t('offline.noFarms', 'You have no farms available for offline viewing. Connect to the internet to sync your data.')}
            </Text>
          </MotiView>
        </View>
      ) : (
        <FlatList
          data={farms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item }) => (
            <FarmPlotCard 
              plot={item} 
              onPress={handlePress}
              formatArea={formatArea}
            />
          )}
        />
      )}
    </View>
  );
}
