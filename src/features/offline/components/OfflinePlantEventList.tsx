import React from 'react';
import { View, FlatList, ActivityIndicator, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOfflinePlantEvents } from '../hooks/useOfflineQueries';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { PlantEventCard } from '@/src/features/plant-event/components/PlantEventCard';
import { Calendar } from 'lucide-react-native';
import { MotiView } from 'moti';

export function OfflinePlantEventList() {
  const { t } = useTranslation();
  const { data: events, isLoading } = useOfflinePlantEvents({}); // Fetch all events for now
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

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
      ) : !events || events.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="items-center justify-center"
          >
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <Calendar size={40} color={palette.primary} />
            </View>
            <Text className="text-center text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              {t('offline.noEventsTitle', 'No Events Cached')}
            </Text>
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400 px-4">
              {t('offline.noEvents', 'You have no events available for offline viewing. Connect to the internet to sync your data.')}
            </Text>
          </MotiView>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item }) => (
            <PlantEventCard 
              event={item}
              onPress={handlePress}
            />
          )}
        />
      )}
    </View>
  );
}
