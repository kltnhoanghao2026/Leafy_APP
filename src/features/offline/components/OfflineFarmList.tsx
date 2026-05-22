import React, { useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOfflineFarms, useOfflinePendingCount } from '../hooks/useOfflineQueries';
import { useOfflineDeleteFarmPlot } from '../hooks/useOfflineMutations';
import { useAuthContext } from '@/src/features/auth';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { Map, Plus, Pencil, Trash2, Home, LandPlot } from 'lucide-react-native';
import { MotiView } from 'moti';
import { OfflineFarmPlotFormScreen } from './OfflineFarmPlotFormScreen';
import { OfflineFarmZoneList } from './OfflineFarmZoneList';
import type { FarmPlotResponse } from '@/src/features/farm';

export function OfflineFarmList() {
  const { t, i18n } = useTranslation();
  const { profileId } = useAuthContext();
  const { data: farms, isLoading, refetch } = useOfflineFarms(profileId || undefined);
  const { data: pendingCount } = useOfflinePendingCount();
  const deleteFarm = useOfflineDeleteFarmPlot();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const [formVisible, setFormVisible] = useState(false);
  const [editingPlot, setEditingPlot] = useState<FarmPlotResponse | undefined>();
  const [expandedZonesId, setExpandedZonesId] = useState<string | null>(null);

  const formatArea = (m2: number) => {
    if (m2 >= 10000) return `${(m2 / 10000).toFixed(1)} ha`;
    return `${m2} m²`;
  };

  const handleEdit = (plot: FarmPlotResponse) => {
    setEditingPlot(plot);
    setFormVisible(true);
  };

  const handleDelete = (plot: FarmPlotResponse) => {
    Alert.alert(
      'Xóa vườn',
      `Xóa vườn "${plot.name}"? Thay đổi sẽ đồng bộ khi có mạng.`,
      [
        { text: t('common.cancel', 'Huỷ'), style: 'cancel' },
        {
          text: t('common.delete', 'Xóa'), style: 'destructive',
          onPress: async () => {
            try {
              await deleteFarm.mutateAsync(plot.id);
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
            {pendingCount} {t('offline.changesPending', 'thay đổi chờ đồng bộ')}
          </Text>
        </View>
      )}

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
              {t('offline.noFarmsTitle', 'Chưa có vườn')}
            </Text>
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400 px-4">
              {t('offline.noFarms', 'Nhấn + để thêm vườn mới hoặc kết nối mạng để đồng bộ.')}
            </Text>
          </MotiView>
        </View>
      ) : (
        <FlatList
          data={farms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View className="mb-2">
              {/* Inline offline farm card */}
              <View className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-3 gap-3">
                    <View className="items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-400/15 p-2">
                      <Home size={22} color={colorScheme === 'dark' ? '#34d399' : '#047857'} strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-800 dark:text-slate-100" numberOfLines={1}>{item.name}</Text>
                      <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{item.status}</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => handleEdit(item)} className="items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 p-2">
                      <Pencil size={15} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} className="items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 p-2">
                      <Trash2 size={15} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                {item.areaM2 ? (
                  <View className="mt-2 flex-row items-center gap-1.5">
                    <LandPlot size={14} color={colorScheme === 'dark' ? '#34d399' : '#059669'} />
                    <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">{formatArea(item.areaM2)}</Text>
                  </View>
                ) : null}
                {item.addressLine ? (
                  <Text className="mt-1.5 text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>{item.addressLine}</Text>
                ) : null}
              </View>

              {/* Zones toggle button */}
              <TouchableOpacity
                onPress={() => setExpandedZonesId(expandedZonesId === item.id ? null : item.id)}
                className="mx-1 mt-1 mb-1 flex-row items-center gap-2 px-2 py-1.5"
              >
                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {expandedZonesId === item.id ? `▲ ${t('offline.farmZone.hide', 'Ẩn vùng canh tác')}` : `▼ ${t('offline.farmZone.show', 'Xem vùng canh tác')}`}
                </Text>
              </TouchableOpacity>
              {expandedZonesId === item.id && (
                <OfflineFarmZoneList farmPlotId={item.id} />
              )}
            </View>
          )}

        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => { setEditingPlot(undefined); setFormVisible(true); }}
        className="absolute right-5 bottom-6 h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg dark:bg-emerald-500 shadow-emerald-600/30"
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <OfflineFarmPlotFormScreen
        visible={formVisible}
        plot={editingPlot}
        onClose={() => { setFormVisible(false); setEditingPlot(undefined); }}
        onSaved={() => refetch()}
      />
    </View>
  );
}
