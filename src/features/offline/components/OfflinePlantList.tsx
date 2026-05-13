import React from 'react';
import { View, FlatList, ActivityIndicator, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOfflinePlants } from '../hooks/useOfflineQueries';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { PlantCard } from '@/src/features/plant/components/PlantCard';
import { Sprout } from 'lucide-react-native';
import { MotiView } from 'moti';

export function OfflinePlantList() {
  const { t } = useTranslation();
  const { data: plantsPage, isLoading } = useOfflinePlants({ page: 0, size: 50 });
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const plants = plantsPage?.content || [];

  const handlePress = () => {
    Alert.alert(
      t('offline.readOnly', 'Read Only Mode'),
      t('offline.actionDisabled', 'This action is unavailable while offline.')
    );
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : plants.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="items-center justify-center"
          >
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <Sprout size={40} color={palette.primary} />
            </View>
            <Text className="text-center text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              {t('offline.noPlantsTitle', 'No Plants Cached')}
            </Text>
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400 px-4">
              {t('offline.noPlants', 'You have no plants available for offline viewing. Connect to the internet to sync your data.')}
            </Text>
          </MotiView>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item }) => (
            <PlantCard 
              plant={item}
              onPress={handlePress}
            />
          )}
        />
      )}
    </View>
  );
}
