import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOfflineFarmZones } from '../hooks/useOfflineQueries';
import { useOfflineDeleteFarmZone } from '../hooks/useOfflineMutations';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { Layers, Plus, Pencil, Trash2 } from 'lucide-react-native';
import { OfflineFarmZoneFormScreen } from './OfflineFarmZoneFormScreen';
import type { FarmZoneResponse } from '@/src/features/farm';

type Props = {
  farmPlotId: string;
};

export function OfflineFarmZoneList({ farmPlotId }: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const { data: zones, isLoading, refetch } = useOfflineFarmZones(farmPlotId);
  const deleteZone = useOfflineDeleteFarmZone();

  const [formVisible, setFormVisible] = useState(false);
  const [editingZone, setEditingZone] = useState<FarmZoneResponse | undefined>();

  const handleDelete = (zone: FarmZoneResponse) => {
    Alert.alert(
      t('offline.farmZone.delete', 'Xóa vùng'),
      `${t('offline.farmZone.deleteConfirm', 'Xóa vùng')} "${zone.zoneName}"?`,
      [
        { text: t('common.cancel', 'Hủy'), style: 'cancel' },
        {
          text: t('common.delete', 'Xóa'), style: 'destructive',
          onPress: async () => {
            try {
              await deleteZone.mutateAsync({ id: zone.id, farmPlotId });
              refetch();
            } catch (e: any) {
              Alert.alert(t('common.error', 'Lỗi'), e?.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="items-center py-3">
        <ActivityIndicator size="small" color={palette.primary} />
      </View>
    );
  }

  return (
    <View className="ml-2 mr-1 mb-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center gap-2">
          <Layers size={14} color={palette.primary} />
          <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {t('offline.farmZone.title', 'Vùng canh tác')} ({zones?.length ?? 0})
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { setEditingZone(undefined); setFormVisible(true); }}
          className="flex-row items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5"
        >
          <Plus size={12} color="#fff" />
          <Text className="text-xs font-bold text-white">{t('common.add', 'Thêm')}</Text>
        </TouchableOpacity>
      </View>

      {/* Zones list */}
      {!zones || zones.length === 0 ? (
        <View className="items-center py-5">
          <Text className="text-xs text-slate-400 dark:text-slate-500">{t('offline.farmZone.noZones', 'Chưa có vùng canh tác')}</Text>
        </View>
      ) : (
        zones.map((zone, idx) => (
          <View
            key={zone.id}
            className={`flex-row items-center px-4 py-3 ${idx < zones.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}
          >
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{zone.zoneName}</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {zone.zoneCode}{zone.areaM2 ? ` · ${zone.areaM2} m²` : ''}
                {zone.cropType ? ` · ${zone.cropType}` : ''}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => { setEditingZone(zone); setFormVisible(true); }}
                className="rounded-full bg-slate-100 dark:bg-slate-800 p-1.5"
              >
                <Pencil size={13} color={palette.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(zone)}
                className="rounded-full bg-red-50 dark:bg-red-900/20 p-1.5"
              >
                <Trash2 size={13} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <OfflineFarmZoneFormScreen
        visible={formVisible}
        farmPlotId={farmPlotId}
        zone={editingZone}
        onClose={() => { setFormVisible(false); setEditingZone(undefined); }}
        onSaved={() => refetch()}
      />
    </View>
  );
}
