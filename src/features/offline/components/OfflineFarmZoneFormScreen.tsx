import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, CalendarDays } from 'lucide-react-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { useOfflineCreateFarmZone, useOfflineUpdateFarmZone } from '../hooks/useOfflineMutations';
import { toDateInputValue, formatDateOnly } from "@/src/utils/date";
import type { FarmZoneResponse } from '@/src/features/farm';
import { FormField } from '@/src/components/ui/FormField';

const ZONE_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

type Props = {
  visible: boolean;
  farmPlotId: string;
  zone?: FarmZoneResponse; // if editing
  onClose: () => void;
  onSaved?: () => void;
};

export function OfflineFarmZoneFormScreen({ visible, farmPlotId, zone, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isEdit = !!zone;

  const createZone = useOfflineCreateFarmZone();
  const updateZone = useOfflineUpdateFarmZone();

  const [zoneName, setZoneName] = useState(zone?.zoneName ?? '');
  const [zoneCode, setZoneCode] = useState(zone?.zoneCode ?? '');
  const [description, setDescription] = useState(zone?.description ?? '');
  const [areaM2, setAreaM2] = useState(zone?.areaM2?.toString() ?? '');
  const [soilType, setSoilType] = useState(zone?.soilType ?? '');
  const [cropType, setCropType] = useState(zone?.cropType ?? '');
  const [plantingDate, setPlantingDate] = useState(zone?.plantingDate ?? '');
  const [elevationM, setElevationM] = useState(zone?.elevationM?.toString() ?? '');
  const [status, setStatus] = useState<typeof ZONE_STATUSES[number]>((zone?.status as any) ?? 'ACTIVE');

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setZoneName(zone?.zoneName ?? '');
      setZoneCode(zone?.zoneCode ?? '');
      setDescription(zone?.description ?? '');
      setAreaM2(zone?.areaM2?.toString() ?? '');
      setSoilType(zone?.soilType ?? '');
      setCropType(zone?.cropType ?? '');
      setPlantingDate(zone?.plantingDate ?? '');
      setElevationM(zone?.elevationM?.toString() ?? '');
      setStatus((zone?.status as any) ?? 'ACTIVE');
    }
  }, [visible, zone]);

  const handleSave = async () => {
    if (!zoneName.trim()) { Alert.alert(t('offline.form.error'), 'Vui lòng nhập tên vùng'); return; }
    if (!zoneCode.trim()) { Alert.alert(t('offline.form.error'), 'Vui lòng nhập mã vùng'); return; }

    const formatDate = (d: string) => {
      const trimmed = d.trim();
      if (!trimmed) return undefined;
      if (trimmed.length === 10) return `${trimmed}T00:00:00`;
      return trimmed;
    };

    try {
      if (isEdit && zone) {
        await updateZone.mutateAsync({
          id: zone.id, farmPlotId,
          updates: { zoneName: zoneName.trim(), zoneCode: zoneCode.trim(), description: description.trim() || undefined, areaM2: areaM2 ? parseFloat(areaM2) : undefined, soilType: soilType.trim() || undefined, cropType: cropType.trim() || undefined, plantingDate: formatDate(plantingDate), elevationM: elevationM ? parseFloat(elevationM) : undefined, status },
        });
      } else {
        await createZone.mutateAsync({
          farmPlotId,
          data: { zoneName: zoneName.trim(), zoneCode: zoneCode.trim(), description: description.trim() || undefined, areaM2: areaM2 ? parseFloat(areaM2) : undefined, soilType: soilType.trim() || undefined, cropType: cropType.trim() || undefined, plantingDate: formatDate(plantingDate), elevationM: elevationM ? parseFloat(elevationM) : undefined },
        });
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? 'Lỗi không xác định');
    }
  };

  const isPending = createZone.isPending || updateZone.isPending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isEdit ? t('offline.farmZone.edit', 'Sửa vùng canh tác') : t('offline.farmZone.add', 'Thêm vùng canh tác (offline)')}
            </Text>
            <TouchableOpacity onPress={onClose} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
              <X size={18} color={palette.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4" keyboardShouldPersistTaps="handled">
            <View className="gap-4">
              {[
                { label: `${t('farmZone.form.zoneName', 'Tên vùng')} *`, value: zoneName, set: setZoneName, placeholder: 'Vùng A' },
                { label: `${t('farmZone.form.zoneCode', 'Mã vùng')} *`, value: zoneCode, set: setZoneCode, placeholder: 'ZONE-A' },
                { label: t('farmZone.form.description', 'Mô tả'), value: description, set: setDescription, placeholder: 'Mô tả vùng...' },
                { label: t('farmZone.form.area', 'Diện tích (m²)'), value: areaM2, set: setAreaM2, placeholder: '500', numeric: true },
                { label: t('farmZone.form.soilType', 'Loại đất'), value: soilType, set: setSoilType, placeholder: 'Đất thịt' },
                { label: t('farmZone.form.cropType', 'Loại cây trồng'), value: cropType, set: setCropType, placeholder: 'Cà phê' },
                { label: t('farmZone.form.elevation', 'Độ cao (m)'), value: elevationM, set: setElevationM, placeholder: '500', numeric: true },
              ].map(({ label, value, set, placeholder, numeric }) => (
                <FormField key={label} label={label}>
                  <TextInput
                    value={value} onChangeText={set} placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    keyboardType={numeric ? 'decimal-pad' : 'default'}
                    className="h-11 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                  />
                </FormField>
              ))}

              {/* Planting Date Picker */}
              <FormField label={t('farmZone.form.plantingDate', 'Ngày trồng')}>
                <View>
                  <TouchableOpacity
                    className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                    onPress={() => setIsDatePickerVisible(true)}
                  >
                    <Text className={`text-sm font-medium ${plantingDate ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                      {plantingDate || t("plant.form.datePlaceholder", "Chọn ngày")}
                    </Text>
                    <CalendarDays size={18} className="text-slate-400 dark:text-slate-500" />
                  </TouchableOpacity>
                  {isDatePickerVisible && (
                    <DateTimePicker
                      value={toDateInputValue(plantingDate)}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(_, selectedDate) => {
                        setIsDatePickerVisible(false);
                        if (selectedDate) setPlantingDate(formatDateOnly(selectedDate));
                      }}
                    />
                  )}
                </View>
              </FormField>

              {isEdit && (
                <FormField label={t('common.status', 'Trạng thái')}>
                  <View className="flex-row gap-2">
                    {ZONE_STATUSES.map(s => (
                      <TouchableOpacity key={s} onPress={() => setStatus(s)} className={`flex-1 h-10 items-center justify-center rounded-xl border ${status === s ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                        <Text className={`text-xs font-bold ${status === s ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </FormField>
              )}
            </View>

            <View className="mt-6 mb-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
              <Text className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {t('offline.form.offlineNotice', 'Dữ liệu sẽ được lưu cục bộ và đồng bộ lên server khi có mạng.')}
              </Text>
            </View>
          </ScrollView>

          <View className="px-5 py-4 border-t border-slate-200 dark:border-slate-800">
            <TouchableOpacity onPress={handleSave} disabled={isPending} className="h-12 items-center justify-center rounded-2xl bg-emerald-600 dark:bg-emerald-500">
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
