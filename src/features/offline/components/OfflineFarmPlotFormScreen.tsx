import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { useOfflineCreateFarmPlot, useOfflineUpdateFarmPlot } from '../hooks/useOfflineMutations';
import { useAuthContext } from '@/src/features/auth';
import type { FarmPlotResponse } from '@/src/features/farm';

const FARM_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

type Props = {
  visible: boolean;
  plot?: FarmPlotResponse; // if editing
  onClose: () => void;
  onSaved?: () => void;
};

export function OfflineFarmPlotFormScreen({ visible, plot, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { profileId } = useAuthContext();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isEdit = !!plot;

  const createFarm = useOfflineCreateFarmPlot();
  const updateFarm = useOfflineUpdateFarmPlot();

  const [name, setName] = useState(plot?.name ?? '');
  const [description, setDescription] = useState(plot?.description ?? '');
  const [areaM2, setAreaM2] = useState(plot?.areaM2?.toString() ?? '');
  const [addressLine, setAddressLine] = useState(plot?.addressLine ?? '');
  const [latitude, setLatitude] = useState(plot?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(plot?.longitude?.toString() ?? '');
  const [status, setStatus] = useState<typeof FARM_STATUSES[number]>((plot?.status as any) ?? 'ACTIVE');

  useEffect(() => {
    if (visible) {
      setName(plot?.name ?? '');
      setDescription(plot?.description ?? '');
      setAreaM2(plot?.areaM2?.toString() ?? '');
      setAddressLine(plot?.addressLine ?? '');
      setLatitude(plot?.latitude?.toString() ?? '');
      setLongitude(plot?.longitude?.toString() ?? '');
      setStatus((plot?.status as any) ?? 'ACTIVE');
    }
  }, [visible, plot]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('offline.form.error'), t('farm.form.nameRequired', 'Vui lòng nhập tên vườn'));
      return;
    }
    try {
      if (isEdit && plot) {
        await updateFarm.mutateAsync({
          id: plot.id,
          updates: {
            name: name.trim(), description: description.trim() || undefined,
            areaM2: areaM2 ? parseFloat(areaM2) : undefined,
            addressLine: addressLine.trim() || undefined,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            status,
          }
        });
      } else {
        await createFarm.mutateAsync({
          ownerProfileId: profileId!,
          name: name.trim(),
          description: description.trim() || undefined,
          areaM2: areaM2 ? parseFloat(areaM2) : undefined,
          addressLine: addressLine.trim() || undefined,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
        });
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? 'Lỗi không xác định');
    }
  };

  const isPending = createFarm.isPending || updateFarm.isPending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#020617]" edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617]">
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isEdit ? t('offline.farm.edit', 'Sửa vườn') : t('offline.farm.add', 'Thêm vườn (offline)')}
            </Text>
            <TouchableOpacity onPress={onClose} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
              <X size={18} color={palette.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4" keyboardShouldPersistTaps="handled">
            <View className="border rounded-[20px] p-4 bg-white dark:bg-slate-900 border-green-800/10 dark:border-green-400/10">
              <Text className="text-base font-bold mb-3 text-slate-900 dark:text-white">
                {t("farm.form.mainInfo", "Thông tin chính")}
              </Text>

              {/* Name */}
              <View className="mb-3">
                <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
                  {t('farm.form.farmName', 'Tên vườn')} *
                </Text>
                <TextInput 
                  value={name} onChangeText={setName} 
                  placeholder={t('farm.form.farmNamePlaceholder', 'Tên vườn của bạn')} 
                  placeholderTextColor="#94A3B8" 
                  className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent" 
                />
              </View>

              {/* Description */}
              <View className="mb-3">
                <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
                  {t('farm.form.description', 'Mô tả')}
                </Text>
                <TextInput 
                  value={description} onChangeText={setDescription} 
                  placeholder={t('farm.form.descriptionPlaceholder', 'Mô tả vườn')} 
                  placeholderTextColor="#94A3B8" 
                  multiline numberOfLines={3} textAlignVertical="top" 
                  className="min-h-[90px] h-[90px] pt-2.5 border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent" 
                />
              </View>

              {/* Area */}
              <View className="mb-3">
                <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
                  {t('farm.form.area', 'Diện tích (m²)')}
                </Text>
                <TextInput 
                  value={areaM2} onChangeText={setAreaM2} 
                  keyboardType="decimal-pad" 
                  placeholder="1000" 
                  placeholderTextColor="#94A3B8" 
                  className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent" 
                />
              </View>

              {/* Address Line */}
              <View className="mb-3">
                <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
                  {t('farm.form.addressLine', 'Địa chỉ')}
                </Text>
                <TextInput 
                  value={addressLine} onChangeText={setAddressLine} 
                  placeholder={t('farm.form.addressLinePlaceholder', 'Số nhà, tên đường...')} 
                  placeholderTextColor="#94A3B8" 
                  className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent" 
                />
              </View>

              {/* Lat / Lng */}
              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
                    {t('farm.form.latitude', 'Vĩ độ')}
                  </Text>
                  <TextInput 
                    value={latitude} onChangeText={setLatitude} 
                    keyboardType="decimal-pad" 
                    placeholder="10.7769" 
                    placeholderTextColor="#94A3B8" 
                    className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent" 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
                    {t('farm.form.longitude', 'Kinh độ')}
                  </Text>
                  <TextInput 
                    value={longitude} onChangeText={setLongitude} 
                    keyboardType="decimal-pad" 
                    placeholder="106.7009" 
                    placeholderTextColor="#94A3B8" 
                    className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent" 
                  />
                </View>
              </View>

              {isEdit && (
                <View className="mb-1">
                  <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
                    {t('common.status', 'Trạng thái')}
                  </Text>
                  <View className="flex-row gap-2 flex-wrap">
                    {FARM_STATUSES.map(s => (
                      <TouchableOpacity 
                        key={s} onPress={() => setStatus(s)} 
                        className={`rounded-full border px-3.5 py-2 ${status === s ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/25' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
                      >
                        <Text className={`text-xs font-bold ${status === s ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View className="mb-6 flex-row items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 border border-amber-100 dark:border-amber-900/50">
              <Text className="text-xs text-amber-700 dark:text-amber-400 font-medium flex-1">
                {t('offline.form.offlineNotice', 'Dữ liệu sẽ được lưu cục bộ và đồng bộ lên server khi có mạng.')}
              </Text>
            </View>
          </ScrollView>

          <View className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617]">
            <TouchableOpacity 
              onPress={handleSave} disabled={isPending} 
              className="h-[46px] items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500"
            >
              {isPending ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-base font-bold text-white">{isEdit ? t('common.save', 'Lưu') : t('common.add', 'Thêm')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
