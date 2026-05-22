import React, { useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOfflinePlantEvents, useOfflinePendingCount } from '../hooks/useOfflineQueries';
import { useOfflineDeletePlantEvent, useOfflineTogglePlantEventCompleted } from '../hooks/useOfflineMutations';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { PlantEventCard } from '@/src/features/plant-event/components/PlantEventCard';
import { Calendar, Plus } from 'lucide-react-native';
import { MotiView } from 'moti';
import { OfflinePlantEventFormScreen } from './OfflinePlantEventFormScreen';
import type { PlantEventResponse } from '@/src/features/plant-event';

export function OfflinePlantEventList() {
  const { t } = useTranslation();
  const { data: events, isLoading, refetch } = useOfflinePlantEvents({});
  const { data: pendingCount } = useOfflinePendingCount();
  const deleteEvent = useOfflineDeletePlantEvent();
  const toggleCompleted = useOfflineTogglePlantEventCompleted();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const [formVisible, setFormVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlantEventResponse | undefined>();

  const handleEdit = (event: PlantEventResponse) => {
    setEditingEvent(event);
    setFormVisible(true);
  };

  const handleDelete = (event: PlantEventResponse) => {
    Alert.alert(
      'Xóa sự kiện',
      `Xóa sự kiện "${event.note}"? Thay đổi sẽ đồng bộ khi có mạng.`,
      [
        { text: t('common.cancel', 'Huỷ'), style: 'cancel' },
        {
          text: t('common.delete', 'Xóa'), style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent.mutateAsync(event.id);
              refetch();
            } catch (e: any) {
              Alert.alert(t('common.error'), e?.message);
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (event: PlantEventResponse) => {
    try {
      await toggleCompleted.mutateAsync(event.id);
      refetch();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message);
    }
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Pending badge */}
      {(pendingCount ?? 0) > 0 && (
        <View className="mx-4 mt-3 flex-row items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5">
          <View className="h-2 w-2 rounded-full bg-amber-500" />
          <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {pendingCount} {t('offline.changesPending', 'thay đổi chờ đồng bộ')}
          </Text>
        </View>
      )}

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
              {t('offline.noEventsTitle', 'Chưa có sự kiện')}
            </Text>
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400 px-4">
              {t('offline.noEvents', 'Nhấn + để thêm sự kiện mới hoặc kết nối mạng để đồng bộ.')}
            </Text>
          </MotiView>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleToggle(item)}
              activeOpacity={0.85}
            >
              <PlantEventCard
                event={item}
                onEdit={() => handleEdit(item)}
                onDelete={handleDelete}
              />
            </TouchableOpacity>
          )}

        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => { setEditingEvent(undefined); setFormVisible(true); }}
        className="absolute right-5 bottom-6 h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg dark:bg-emerald-500 shadow-emerald-600/30"
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <OfflinePlantEventFormScreen
        visible={formVisible}
        event={editingEvent}
        onClose={() => { setFormVisible(false); setEditingEvent(undefined); }}
        onSaved={() => refetch()}
      />
    </View>
  );
}
