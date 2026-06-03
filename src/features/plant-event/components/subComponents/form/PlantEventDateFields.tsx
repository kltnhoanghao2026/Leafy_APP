import React from "react";
import { View, Text, TextInput, TouchableOpacity, Platform } from "react-native";
import { Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays, Clock } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { FormField } from "@/src/components/ui/FormField";
import { toDateInputValue, formatDateOnly } from "@/src/utils/date";

interface PlantEventDateFieldsProps {
  control: any;
  errors: any;
  daysFromStartValue: number | null;
  isStartDatePickerVisible: boolean;
  setIsStartDatePickerVisible: (visible: boolean) => void;
  isEndDatePickerVisible: boolean;
  setIsEndDatePickerVisible: (visible: boolean) => void;
}

export function PlantEventDateFields({
  control,
  errors,
  daysFromStartValue,
  isStartDatePickerVisible,
  setIsStartDatePickerVisible,
  isEndDatePickerVisible,
  setIsEndDatePickerVisible,
}: PlantEventDateFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Start date */}
      <FormField
        label={t("plantEvent.form.startDate")}
        error={errors.calculatedStartDate?.message}
      >
        <Controller
          control={control}
          name="calculatedStartDate"
          render={({ field: { onChange, value } }) => (
            <View>
              <TouchableOpacity
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                onPress={() => setIsStartDatePickerVisible(true)}
              >
                <Text
                  className={`text-sm font-medium ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                >
                  {value || t("plantEvent.form.datePlaceholder")}
                </Text>
                <CalendarDays
                  size={18}
                  className="text-slate-400 dark:text-slate-500"
                />
              </TouchableOpacity>
              {isStartDatePickerVisible ? (
                <DateTimePicker
                  value={toDateInputValue(value)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, selectedDate) => {
                    setIsStartDatePickerVisible(false);
                    if (selectedDate)
                      onChange(formatDateOnly(selectedDate));
                  }}
                />
              ) : null}
            </View>
          )}
        />
      </FormField>

      {/* End date */}
      <FormField
        label={t("plantEvent.form.endDate")}
        error={errors.calculatedEndDate?.message}
      >
        <Controller
          control={control}
          name="calculatedEndDate"
          render={({ field: { onChange, value } }) => (
            <View>
              <TouchableOpacity
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                onPress={() => setIsEndDatePickerVisible(true)}
              >
                <Text
                  className={`text-sm font-medium ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                >
                  {value || t("plantEvent.form.datePlaceholder")}
                </Text>
                <CalendarDays
                  size={18}
                  className="text-slate-400 dark:text-slate-500"
                />
              </TouchableOpacity>
              {isEndDatePickerVisible ? (
                <DateTimePicker
                  value={toDateInputValue(value)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, selectedDate) => {
                    setIsEndDatePickerVisible(false);
                    if (selectedDate)
                      onChange(formatDateOnly(selectedDate));
                  }}
                />
              ) : null}
            </View>
          )}
        />
      </FormField>

      {/* Days from start */}
      <FormField label={t("plantEvent.form.daysFromStart")} error={errors.daysFromStart?.message}>
        <View className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center gap-2 bg-slate-100 dark:bg-slate-800/50">
          <Clock size={15} className="text-slate-400 dark:text-slate-500" />
          <Text
            className={`flex-1 text-sm font-semibold ${
              daysFromStartValue === null
                ? "text-slate-400 dark:text-slate-500 italic"
                : daysFromStartValue < 0
                  ? "text-red-500 dark:text-red-400"
                  : daysFromStartValue === 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-700 dark:text-slate-300"
            }`}
          >
            {daysFromStartValue === null
              ? "-"
              : String(daysFromStartValue)}
          </Text>
          <View className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
              AUTO
            </Text>
          </View>
        </View>
        <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {t("plantEvent.form.daysFromStartHint")}
        </Text>
      </FormField>

      {/* Duration days */}
      <FormField
        label={t("plantEvent.form.durationDays")}
        error={errors.durationDays?.message}
      >
        <Controller
          control={control}
          name="durationDays"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
              placeholder={t("plantEvent.form.durationDaysPlaceholder")}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </FormField>
    </>
  );
}
