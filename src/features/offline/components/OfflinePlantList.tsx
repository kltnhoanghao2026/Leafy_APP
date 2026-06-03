import React, { useMemo, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOfflinePlants, useOfflineSpecies, useOfflineFarms, useOfflinePendingCount } from '../hooks/useOfflineQueries';
import { useOfflineDeletePlant } from '../hooks/useOfflineMutations';
import { useAuthContext } from '@/src/features/auth';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { PlantCard } from '@/src/features/plant/components/PlantCard';
import { getSpeciesLabel } from '@/src/features/plant';
import { Sprout, Plus } from 'lucide-react-native';
import { MotiView } from 'moti';
import { OfflinePlantFormScreen } from './OfflinePlantFormScreen';
import type { PlantResponse } from '@/src/features/plant';

export function OfflinePlantList() {
  const { t } = useTranslation();
  const { profileId } = useAuthContext();
  const { data: plantsPage, isLoading, refetch } = useOfflinePlants({ page: 0, size: 100 });
  const { data: speciesPage } = useOfflineSpecies();
  const { data: farms } = useOfflineFarms(profileId ?? undefined);
  const { data: pendingCount } = useOfflinePendingCount();
  const deletePlant = useOfflineDeletePlant();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const [formVisible, setFormVisible] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantResponse | undefined>();

  const plants = plantsPage?.content || [];

  // Build species lookup map (fixes "Không rõ loài" bug)
  const speciesById = useMemo(
    () => new Map((speciesPage ?? []).map(s => [s.id, getSpeciesLabel(s)])),
    [speciesPage]
  );

  // Build farm lookup map
  const farmById = useMemo(
    () => new Map((farms ?? []).map(f => [f.id, f.name])),
    [farms]
  );

  const handleEdit = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    setEditingPlant(plant);
    setFormVisible(true);
  };

  const handleDelete = (plant: PlantResponse) => {
    Alert.alert(
      t('plant.list.deleteTitle', 'Xóa cây trồng'),
      t('plant.list.deleteMessage', { name: plant.plantNumber, defaultValue: `Xóa "${plant.plantNumber}"? Thay đổi sẽ được đồng bộ khi có mạng.` }),
      [
        { text: t('common.cancel', 'Huỷ'), style: 'cancel' },
        {
          text: t('common.delete', 'Xóa'), style: 'destructive',
          onPress: async () => {
            try {
              await deletePlant.mutateAsync(plant.id);
              refetch();
            } catch (e: any) {
              Alert.alert(t('common.error'), e?.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Pending badge */}
      {(pendingCount ?? 0) > 0 && (
        <View className="mx-4 mt-3 flex-row items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5">
          <View className="h-2 w-2 rounded-full bg-amber-500" />
          <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {t('offline.pendingChanges', { count: pendingCount, defaultValue: `${pendingCount} thay đổi chờ đồng bộ` })}
          </Text>
        </View>
      )}

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
              {t('offline.noPlantsTitle', 'Chưa có cây trồng')}
            </Text>
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400 px-4">
              {t('offline.noPlants', 'Nhấn + để thêm cây trồng mới hoặc kết nối mạng để đồng bộ dữ liệu.')}
            </Text>
          </MotiView>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              speciesName={speciesById.get(item.speciesId)}
              farmPlotName={farmById.get(item.farmPlotId)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => { setEditingPlant(undefined); setFormVisible(true); }}
        className="absolute right-5 bottom-6 h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg dark:bg-emerald-500 shadow-emerald-600/30"
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <OfflinePlantFormScreen
        visible={formVisible}
        plant={editingPlant}
        onClose={() => { setFormVisible(false); setEditingPlant(undefined); }}
        onSaved={() => refetch()}
      />
    </View>
  );
}
