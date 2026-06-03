import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, CalendarDays } from 'lucide-react-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { useOfflineCreatePlantEvent, useOfflineUpdatePlantEvent } from '../hooks/useOfflineMutations';
import { useOfflineFarms, useOfflinePlants } from '../hooks/useOfflineQueries';
import { useAuthContext } from '@/src/features/auth';
import { EVENT_TYPE_VALUES, getEventTypeIcon } from '@/src/features/plant-event';
import { toDateInputValue, formatDateOnly } from "@/src/utils/date";
import type { PlantEventResponse, EventType } from '@/src/features/plant-event';
import { FormField } from '@/src/components/ui/FormField';
import { PickerModal } from '@/src/components/ui/PickerModal';
import type { FarmPlotResponse } from '@/src/features/farm';
import type { PlantResponse } from '@/src/features/plant';

type Props = {
  visible: boolean;
  event?: PlantEventResponse; // if editing
  onClose: () => void;
  onSaved?: () => void;
};

export function OfflinePlantEventFormScreen({ visible, event, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { profileId } = useAuthContext();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isEdit = !!event;

  const createEvent = useOfflineCreatePlantEvent();
  const updateEvent = useOfflineUpdatePlantEvent();

  const { data: farms } = useOfflineFarms(profileId ?? undefined);
  const { data: plantsPage } = useOfflinePlants({ page: 0, size: 200 });
  const plants = plantsPage?.content ?? [];
  const farmList = farms ?? [];

  const [eventType, setEventType] = useState<EventType>(event?.eventType ?? 'IRRIGATION');
  const [note, setNote] = useState(event?.note ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startDate, setStartDate] = useState(event?.calculatedStartDate ?? '');
  const [endDate, setEndDate] = useState(event?.calculatedEndDate ?? '');
  const [farmPlotId, setFarmPlotId] = useState(event?.farmPlotId ?? '');
  const [plantId, setPlantId] = useState(event?.plantId ?? '');
  
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showFarmPicker, setShowFarmPicker] = useState(false);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setEventType(event?.eventType ?? 'IRRIGATION');
      setNote(event?.note ?? '');
      setDescription(event?.description ?? '');
      setStartDate(event?.calculatedStartDate ?? '');
      setEndDate(event?.calculatedEndDate ?? '');
      setFarmPlotId(event?.farmPlotId ?? '');
      setPlantId(event?.plantId ?? '');
    }
  }, [visible, event]);

  const selectedFarm = farmList.find(f => f.id === farmPlotId);
  const selectedPlant = plants.find(p => p.id === plantId);

  const formatDate = (d: string) => {
    const trimmed = d.trim();
    if (!trimmed) return undefined;
    if (trimmed.length === 10) return `${trimmed}T00:00:00`;
    return trimmed;
  };

  const handleSave = async () => {
    if (!note.trim()) { Alert.alert(t('offline.form.error'), 'Vui lòng nhập ghi chú'); return; }
    try {
      if (isEdit && event) {
        await updateEvent.mutateAsync({ 
            id: event.id, 
            updates: { 
                eventType, 
                note: note.trim(), 
                description: description.trim() || undefined, 
                calculatedStartDate: formatDate(startDate), 
                calculatedEndDate: formatDate(endDate) 
            } 
        });
      } else {
        await createEvent.mutateAsync({ 
            eventType, 
            note: note.trim(), 
            description: description.trim() || undefined, 
            calculatedStartDate: formatDate(startDate), 
            calculatedEndDate: formatDate(endDate), 
            farmPlotId: farmPlotId || undefined, 
            plantId: plantId || undefined 
        });
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? 'Lỗi không xác định');
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;
  const EventIcon = getEventTypeIcon(eventType);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isEdit ? t('offline.plantEvent.edit', 'Sửa sự kiện') : t('offline.plantEvent.add', 'Thêm sự kiện (offline)')}
            </Text>
            <TouchableOpacity onPress={onClose} className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
              <X size={18} color={palette.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4" keyboardShouldPersistTaps="handled">
            <View className="gap-4">
              {/* Event Type Picker */}
              <FormField label={`${t('plantEvent.form.eventType', 'Loại sự kiện')} *`}>
                <TouchableOpacity onPress={() => setShowTypePicker(true)} className="h-12 flex-row items-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-white dark:bg-slate-800">
                  <EventIcon size={18} color={palette.primary} />
                  <Text className="flex-1 text-sm font-semibold text-slate-800 dark:text-white">{t(`plantEvent.type.${eventType}`, eventType)}</Text>
                  <ChevronDown size={16} color="#94A3B8" />
                </TouchableOpacity>
              </FormField>

              {/* Note */}
              <FormField label={`${t('plantEvent.form.note', 'Ghi chú')} *`}>
                <TextInput value={note} onChangeText={setNote} placeholder={t('plantEvent.form.notePlaceholder', 'Ghi chú sự kiện...')} placeholderTextColor="#94A3B8" multiline numberOfLines={3} textAlignVertical="top" className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 pt-2.5 text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800 h-24" />
              </FormField>

              {/* Description */}
              <FormField label={t('plantEvent.form.description', 'Mô tả')}>
                <TextInput value={description} onChangeText={setDescription} placeholder={t('plantEvent.form.descriptionPlaceholder', 'Mô tả chi tiết...')} placeholderTextColor="#94A3B8" multiline numberOfLines={2} textAlignVertical="top" className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 pt-2.5 text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800 h-20" />
              </FormField>

              {/* Start / End Date */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormField label={t('plantEvent.form.startDate', 'Ngày bắt đầu')}>
                    <View>
                      <TouchableOpacity
                        className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                        onPress={() => setIsStartDatePickerVisible(true)}
                      >
                        <Text className={`text-sm font-medium ${startDate ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                          {startDate || t("plant.form.datePlaceholder", "Chọn ngày")}
                        </Text>
                        <CalendarDays size={18} className="text-slate-400 dark:text-slate-500" />
                      </TouchableOpacity>
                      {isStartDatePickerVisible && (
                        <DateTimePicker
                          value={toDateInputValue(startDate)}
                          mode="date"
                          display={Platform.OS === "ios" ? "spinner" : "default"}
                          onChange={(_, selectedDate) => {
                            setIsStartDatePickerVisible(false);
                            if (selectedDate) setStartDate(formatDateOnly(selectedDate));
                          }}
                        />
                      )}
                    </View>
                  </FormField>
                </View>

                <View className="flex-1">
                  <FormField label={t('plantEvent.form.endDate', 'Ngày kết thúc')}>
                    <View>
                      <TouchableOpacity
                        className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                        onPress={() => setIsEndDatePickerVisible(true)}
                      >
                        <Text className={`text-sm font-medium ${endDate ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                          {endDate || t("plant.form.datePlaceholder", "Chọn ngày")}
                        </Text>
                        <CalendarDays size={18} className="text-slate-400 dark:text-slate-500" />
                      </TouchableOpacity>
                      {isEndDatePickerVisible && (
                        <DateTimePicker
                          value={toDateInputValue(endDate)}
                          mode="date"
                          display={Platform.OS === "ios" ? "spinner" : "default"}
                          onChange={(_, selectedDate) => {
                            setIsEndDatePickerVisible(false);
                            if (selectedDate) setEndDate(formatDateOnly(selectedDate));
                          }}
                        />
                      )}
                    </View>
                  </FormField>
                </View>
              </View>

              {/* Farm Plot Picker */}
              {!isEdit && (
                <>
                  <FormField label={t('plantEvent.form.farmPlot', 'Vườn (nếu có)')}>
                    <TouchableOpacity onPress={() => setShowFarmPicker(true)} className="h-11 flex-row items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-white dark:bg-slate-800">
                      <Text className={`text-sm ${selectedFarm ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>{selectedFarm ? selectedFarm.name : t('plantEvent.form.selectFarm', 'Chọn vườn...')}</Text>
                      <ChevronDown size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </FormField>

                  <FormField label={t('plantEvent.form.plant', 'Cây trồng (nếu có)')}>
                    <TouchableOpacity onPress={() => setShowPlantPicker(true)} className="h-11 flex-row items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-white dark:bg-slate-800">
                      <Text className={`text-sm ${selectedPlant ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>{selectedPlant ? (selectedPlant.nickName || selectedPlant.plantNumber) : t('plantEvent.form.selectPlant', 'Chọn cây trồng...')}</Text>
                      <ChevronDown size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </FormField>
                </>
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

        {/* Pickers */}
        <PickerModal<EventType>
          visible={showTypePicker}
          title={t('plantEvent.form.selectEventType', 'Chọn loại sự kiện')}
          items={[...EVENT_TYPE_VALUES]}
          selectedId={eventType}
          keyExtractor={(item) => item}
          labelExtractor={(item) => t(`plantEvent.type.${item}`, item)}
          onClose={() => setShowTypePicker(false)}
          onSelect={(id) => {
            setEventType(id as EventType);
            setShowTypePicker(false);
          }}
          renderItem={(item, isSelected) => {
            const Icon = getEventTypeIcon(item);
            return (
              <TouchableOpacity onPress={() => { setEventType(item); setShowTypePicker(false); }} className={`flex-row items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                <Icon size={18} color={isSelected ? palette.primary : '#94A3B8'} />
                <Text className={`text-sm font-semibold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>{t(`plantEvent.type.${item}`, item)}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <PickerModal<FarmPlotResponse | { id: string; name: string }>
          visible={showFarmPicker}
          title={t('plantEvent.form.selectFarm', 'Chọn vườn')}
          items={[{ id: '', name: t('common.none', '-- Không chọn --') }, ...farmList]}
          selectedId={farmPlotId}
          keyExtractor={(item) => item.id}
          labelExtractor={(item) => (item as any).name}
          onClose={() => setShowFarmPicker(false)}
          onSelect={(id) => {
            setFarmPlotId(id);
            setShowFarmPicker(false);
          }}
        />

        <PickerModal<PlantResponse | { id: string; plantNumber: string }>
          visible={showPlantPicker}
          title={t('plantEvent.form.selectPlant', 'Chọn cây trồng')}
          items={[{ id: '', plantNumber: t('common.none', '-- Không chọn --') }, ...plants]}
          selectedId={plantId}
          keyExtractor={(item) => item.id}
          labelExtractor={(item) => (item as any).nickName || (item as any).plantNumber}
          onClose={() => setShowPlantPicker(false)}
          onSelect={(id) => {
            setPlantId(id);
            setShowPlantPicker(false);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
