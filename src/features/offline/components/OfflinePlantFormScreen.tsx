import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, ChevronUp, Hash, CalendarDays } from 'lucide-react-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { useOfflineSpecies } from '../hooks/useOfflineQueries';
import { useOfflineFarms } from '../hooks/useOfflineQueries';
import { useOfflineCreatePlant, useOfflineUpdatePlant } from '../hooks/useOfflineMutations';
import { useAuthContext } from '@/src/features/auth';
import { getSpeciesLabel } from '@/src/features/plant';
import { toDateInputValue, formatDateOnly } from "@/src/utils/date";
import type { PlantResponse, SpeciesResponse } from '@/src/features/plant';
import type { FarmPlotResponse } from '@/src/features/farm';
import { FormField } from '@/src/components/ui/FormField';
import { FormSection } from '@/src/components/ui/FormSection';
import { PickerModal } from '@/src/components/ui/PickerModal';

const PLANT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

type Props = {
  visible: boolean;
  plant?: PlantResponse; // if editing
  onClose: () => void;
  onSaved?: () => void;
};

export function OfflinePlantFormScreen({ visible, plant, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { profileId } = useAuthContext();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isEdit = !!plant;

  const { data: speciesPage } = useOfflineSpecies();
  const { data: farms } = useOfflineFarms(profileId ?? undefined);
  const createPlant = useOfflineCreatePlant();
  const updatePlant = useOfflineUpdatePlant();

  const [plantNumber, setPlantNumber] = useState(plant?.plantNumber ?? '');
  const [nickName, setNickName] = useState(plant?.nickName ?? '');
  const [tagCode, setTagCode] = useState(plant?.tagCode ?? '');
  const [batchNumber, setBatchNumber] = useState(plant?.batchNumber ?? '');
  const [sourceType, setSourceType] = useState(plant?.sourceType ?? '');
  const [motherPlantId, setMotherPlantId] = useState(plant?.motherPlantId ?? '');
  const [plantingDate, setPlantingDate] = useState(plant?.plantingDate ?? '');
  const [germinationDate, setGerminationDate] = useState(plant?.germinationDate ?? '');
  const [actualHarvestDate, setActualHarvestDate] = useState(plant?.actualHarvestDate ?? '');
  const [totalYieldKg, setTotalYieldKg] = useState(plant?.totalYieldKg?.toString() ?? '');

  const [plantStatus, setPlantStatus] = useState<typeof PLANT_STATUSES[number]>(
    (plant?.plantStatus as any) ?? 'ACTIVE'
  );
  const [speciesId, setSpeciesId] = useState(plant?.speciesId ?? '');
  const [farmPlotId, setFarmPlotId] = useState(plant?.farmPlotId ?? '');

  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [showFarmPicker, setShowFarmPicker] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const [isPlantingDatePickerVisible, setIsPlantingDatePickerVisible] = useState(false);
  const [isGerminationDatePickerVisible, setIsGerminationDatePickerVisible] = useState(false);
  const [isActualHarvestDatePickerVisible, setIsActualHarvestDatePickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setPlantNumber(plant?.plantNumber ?? '');
      setNickName(plant?.nickName ?? '');
      setTagCode(plant?.tagCode ?? '');
      setBatchNumber(plant?.batchNumber ?? '');
      setSourceType(plant?.sourceType ?? '');
      setMotherPlantId(plant?.motherPlantId ?? '');
      setPlantingDate(plant?.plantingDate ?? '');
      setGerminationDate(plant?.germinationDate ?? '');
      setActualHarvestDate(plant?.actualHarvestDate ?? '');
      setTotalYieldKg(plant?.totalYieldKg?.toString() ?? '');
      setPlantStatus((plant?.plantStatus as any) ?? 'ACTIVE');
      setSpeciesId(plant?.speciesId ?? '');
      setFarmPlotId(plant?.farmPlotId ?? '');
    }
  }, [visible, plant]);

  const speciesList = speciesPage ?? [];
  const farmList = farms ?? [];

  const selectedSpecies = speciesList.find(s => s.id === speciesId);
  const selectedFarm = farmList.find(f => f.id === farmPlotId);

  const handleSave = async () => {
    if (!speciesId) { Alert.alert(t('offline.form.error'), t('offline.form.speciesRequired', 'Vui lòng chọn loài cây')); return; }
    if (!farmPlotId && !isEdit) { Alert.alert(t('offline.form.error'), t('offline.form.farmRequired', 'Vui lòng chọn vườn')); return; }

    const formatDate = (d: string) => {
      const trimmed = d.trim();
      if (!trimmed) return undefined;
      if (trimmed.length === 10) return `${trimmed}T00:00:00`;
      return trimmed;
    };

    try {
      if (isEdit && plant) {
        await updatePlant.mutateAsync({ id: plant.id, updates: { 
          plantNumber: plantNumber || undefined, 
          nickName: nickName || undefined, 
          tagCode: tagCode || undefined, 
          batchNumber: batchNumber || undefined,
          sourceType: sourceType || undefined,
          motherPlantId: motherPlantId || undefined,
          plantingDate: formatDate(plantingDate), 
          germinationDate: formatDate(germinationDate),
          actualHarvestDate: formatDate(actualHarvestDate),
          totalYieldKg: totalYieldKg ? parseFloat(totalYieldKg) : undefined,
          plantStatus, 
          speciesId 
        } });
      } else {
        await createPlant.mutateAsync({ 
          plantStatus, 
          speciesId, 
          farmPlotId, 
          plantNumber: plantNumber || undefined, 
          nickName: nickName || undefined, 
          tagCode: tagCode || undefined, 
          batchNumber: batchNumber || undefined,
          sourceType: sourceType || undefined,
          motherPlantId: motherPlantId || undefined,
          plantingDate: formatDate(plantingDate),
          germinationDate: formatDate(germinationDate),
          actualHarvestDate: formatDate(actualHarvestDate),
          totalYieldKg: totalYieldKg ? parseFloat(totalYieldKg) : undefined,
        });
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? 'Lỗi không xác định');
    }
  };

  const isPending = createPlant.isPending || updatePlant.isPending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-[#020617]" edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isEdit ? t('offline.plant.edit', 'Sửa cây trồng') : t('offline.plant.add', 'Thêm cây trồng (offline)')}
            </Text>
            <TouchableOpacity onPress={onClose} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
              <X size={18} color={palette.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4" keyboardShouldPersistTaps="handled">
            
            <FormSection title={t("plant.form.coreSection", "Thông tin cơ bản")}>
              {/* Plant Number */}
              <FormField label={t('plant.form.plantNumber', 'Số cây')}>
                {isEdit ? (
                  <View className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center gap-2 bg-slate-100 dark:bg-slate-800/50">
                    <Hash size={15} className="text-slate-400 dark:text-slate-500" />
                    <Text className="flex-1 text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {plantNumber || "—"}
                    </Text>
                    <View className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5">
                      <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t("plant.form.plantNumberReadOnly", "Chỉ đọc")}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="h-11 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-3 flex-row items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20">
                    <Hash size={15} className="text-emerald-500 dark:text-emerald-400" />
                    <Text className="flex-1 text-sm font-medium text-slate-400 dark:text-slate-500 italic">
                      {t("plant.form.plantNumberAutoGenerated", "Tự động tạo nếu để trống")}
                    </Text>
                    <View className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5">
                      <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">AUTO</Text>
                    </View>
                  </View>
                )}
              </FormField>

              {/* Status */}
              <FormField label={t('plant.form.status', 'Trạng thái')}>
                <View className="flex-row gap-2 flex-wrap">
                  {PLANT_STATUSES.map(s => (
                    <TouchableOpacity
                      key={s} onPress={() => setPlantStatus(s)}
                      className={`rounded-full border px-3.5 py-2 ${plantStatus === s ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/25' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
                    >
                      <Text className={`text-xs font-bold ${plantStatus === s ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {t(`plant.form.statusOptions.${s.toLowerCase()}`, s)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FormField>

              {/* Species Picker */}
              <FormField label={`${t('plant.form.species', 'Loài cây')} *`}>
                <TouchableOpacity onPress={() => setShowSpeciesPicker(true)} className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 justify-center bg-white dark:bg-slate-900">
                  <Text className={`text-sm font-medium ${selectedSpecies ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {selectedSpecies ? getSpeciesLabel(selectedSpecies) : t('plant.form.selectSpecies', 'Chọn loài cây')}
                  </Text>
                </TouchableOpacity>
              </FormField>

              {/* Farm Plot Picker (create only) */}
              {!isEdit && (
                <FormField label={`${t('plant.form.farmPlot', 'Vườn')} *`}>
                  <TouchableOpacity onPress={() => setShowFarmPicker(true)} className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 justify-center bg-white dark:bg-slate-900">
                    <Text className={`text-sm font-medium ${selectedFarm ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {selectedFarm ? selectedFarm.name : t('plant.form.selectFarm', 'Chọn vườn')}
                    </Text>
                  </TouchableOpacity>
                </FormField>
              )}

              {/* Planting Date */}
              <FormField label={t('plant.form.plantingDate', 'Ngày trồng')}>
                <View>
                  <TouchableOpacity
                    className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                    onPress={() => setIsPlantingDatePickerVisible(true)}
                  >
                    <Text className={`text-sm font-medium ${plantingDate ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                      {plantingDate || t("plant.form.datePlaceholder", "Chọn ngày")}
                    </Text>
                    <CalendarDays size={18} className="text-slate-400 dark:text-slate-500" />
                  </TouchableOpacity>
                  {isPlantingDatePickerVisible && (
                    <DateTimePicker
                      value={toDateInputValue(plantingDate)}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(_, selectedDate) => {
                        setIsPlantingDatePickerVisible(false);
                        if (selectedDate) setPlantingDate(formatDateOnly(selectedDate));
                      }}
                    />
                  )}
                </View>
              </FormField>
            </FormSection>

            {/* Advanced Section Toggle */}
            <TouchableOpacity
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex-row items-center justify-between dark:border-slate-800 dark:bg-slate-900"
              onPress={() => setIsAdvancedOpen(!isAdvancedOpen)}
            >
              <Text className="text-sm font-bold text-slate-900 dark:text-white">
                {t("plant.form.advancedSection", "Thông tin bổ sung")}
              </Text>
              {isAdvancedOpen ? <ChevronUp size={18} className="text-slate-500 dark:text-slate-400" /> : <ChevronDown size={18} className="text-slate-500 dark:text-slate-400" />}
            </TouchableOpacity>

            {/* Advanced Section Content */}
            {isAdvancedOpen && (
              <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 gap-3">
                {[
                  { label: "nickName", value: nickName, set: setNickName },
                  { label: "tagCode", value: tagCode, set: setTagCode },
                  { label: "batchNumber", value: batchNumber, set: setBatchNumber },
                  { label: "sourceType", value: sourceType, set: setSourceType },
                  { label: "motherPlantId", value: motherPlantId, set: setMotherPlantId },
                ].map(({ label, value, set }) => (
                  <FormField key={label} label={t(`plant.form.${label}`, label)}>
                    <TextInput
                      value={value} onChangeText={set}
                      placeholder={t(`plant.form.${label}Placeholder`, `Nhập ${label}`)}
                      placeholderTextColor="#9ca3af"
                      className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                    />
                  </FormField>
                ))}

                {/* Germination Date */}
                <FormField label={t('plant.form.germinationDate', 'Ngày nảy mầm')}>
                  <View>
                    <TouchableOpacity
                      className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                      onPress={() => setIsGerminationDatePickerVisible(true)}
                    >
                      <Text className={`text-sm font-medium ${germinationDate ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                        {germinationDate || t("plant.form.datePlaceholder", "Chọn ngày")}
                      </Text>
                      <CalendarDays size={18} className="text-slate-400 dark:text-slate-500" />
                    </TouchableOpacity>
                    {isGerminationDatePickerVisible && (
                      <DateTimePicker
                        value={toDateInputValue(germinationDate)}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(_, selectedDate) => {
                          setIsGerminationDatePickerVisible(false);
                          if (selectedDate) setGerminationDate(formatDateOnly(selectedDate));
                        }}
                      />
                    )}
                  </View>
                </FormField>

                {/* Actual Harvest Date */}
                <FormField label={t('plant.form.actualHarvestDate', 'Ngày thu hoạch thực tế')}>
                  <View>
                    <TouchableOpacity
                      className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                      onPress={() => setIsActualHarvestDatePickerVisible(true)}
                    >
                      <Text className={`text-sm font-medium ${actualHarvestDate ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                        {actualHarvestDate || t("plant.form.datePlaceholder", "Chọn ngày")}
                      </Text>
                      <CalendarDays size={18} className="text-slate-400 dark:text-slate-500" />
                    </TouchableOpacity>
                    {isActualHarvestDatePickerVisible && (
                      <DateTimePicker
                        value={toDateInputValue(actualHarvestDate)}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(_, selectedDate) => {
                          setIsActualHarvestDatePickerVisible(false);
                          if (selectedDate) setActualHarvestDate(formatDateOnly(selectedDate));
                        }}
                      />
                    )}
                  </View>
                </FormField>

                {/* Total Yield */}
                <FormField label={t('plant.form.totalYieldKg', 'Tổng sản lượng (Kg)')}>
                  <TextInput
                    value={totalYieldKg} onChangeText={setTotalYieldKg}
                    placeholder="0.0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </FormField>
              </View>
            )}

            {/* Offline notice */}
            <View className="mb-6 flex-row items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 border border-amber-100 dark:border-amber-900/50">
              <Text className="text-xs text-amber-700 dark:text-amber-400 font-medium flex-1">
                {t('offline.form.offlineNotice', 'Dữ liệu sẽ được lưu cục bộ và đồng bộ lên server khi có mạng.')}
              </Text>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617]">
            <TouchableOpacity
              onPress={handleSave} disabled={isPending}
              className="h-[46px] items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500"
            >
              {isPending ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-base font-bold text-white">
                  {isEdit ? t('common.save', 'Lưu') : t('common.add', 'Thêm')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Pickers */}
        <PickerModal<SpeciesResponse>
          visible={showSpeciesPicker}
          title={t('plant.form.selectSpecies', 'Chọn loài cây')}
          items={speciesList}
          selectedId={speciesId}
          keyExtractor={(item) => item.id}
          labelExtractor={(item) => getSpeciesLabel(item)}
          onClose={() => setShowSpeciesPicker(false)}
          onSelect={(id) => {
            setSpeciesId(id);
            setShowSpeciesPicker(false);
          }}
        />

        <PickerModal<FarmPlotResponse>
          visible={showFarmPicker}
          title={t('plant.form.selectFarm', 'Chọn vườn')}
          items={farmList}
          selectedId={farmPlotId}
          keyExtractor={(item) => item.id}
          labelExtractor={(item) => item.name}
          onClose={() => setShowFarmPicker(false)}
          onSelect={(id) => {
            setFarmPlotId(id);
            setShowFarmPicker(false);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
