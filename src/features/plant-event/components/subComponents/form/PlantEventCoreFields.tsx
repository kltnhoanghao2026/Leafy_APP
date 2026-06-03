import React from "react";
import { View, Text, TextInput, TouchableOpacity, Switch } from "react-native";
import { Controller } from "react-hook-form";
import { ChevronDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { FormField } from "@/src/components/ui/FormField";
import { getEventCategoryColors, getEventTypeIcon } from "../../plant-event.types";
import type { EventType } from "../../plant-event.types";

interface PlantEventCoreFieldsProps {
  control: any;
  errors: any;
  selectedEventType: string | null;
  onSelectEventType: () => void;
}

export function PlantEventCoreFields({
  control,
  errors,
  selectedEventType,
  onSelectEventType,
}: PlantEventCoreFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Event type picker */}
      <FormField
        label={t("plantEvent.form.eventType")}
        error={errors.eventType?.message}
      >
        <TouchableOpacity
          className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center bg-white dark:bg-slate-900"
          onPress={onSelectEventType}
        >
          {selectedEventType ? (
            <>
              {(() => {
                const Icon = getEventTypeIcon(
                  selectedEventType as EventType,
                );
                const colors = getEventCategoryColors(
                  selectedEventType as EventType,
                );
                return (
                  <Icon
                    size={16}
                    className={`${colors.text} ${colors.darkText} mr-2`}
                    strokeWidth={2.2}
                  />
                );
              })()}
              <Text className="text-sm font-medium text-slate-900 dark:text-white flex-1">
                {t(`plantEvent.eventType.${selectedEventType}`)}
              </Text>
              <ChevronDown
                size={16}
                className="text-slate-400 dark:text-slate-500"
              />
            </>
          ) : (
            <>
              <Text className="text-sm font-medium text-slate-400 dark:text-slate-500 flex-1">
                {t("plantEvent.form.eventTypePlaceholder")}
              </Text>
              <ChevronDown
                size={16}
                className="text-slate-400 dark:text-slate-500"
              />
            </>
          )}
        </TouchableOpacity>
      </FormField>

      {/* Note */}
      <FormField
        label={t("plantEvent.form.note")}
        error={errors.note?.message}
      >
        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
              placeholder={t("plantEvent.form.notePlaceholder")}
              placeholderTextColor="#9ca3af"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </FormField>

      {/* isPlanned toggle */}
      <FormField label={t("plantEvent.form.isPlanned")}>
        <Controller
          control={control}
          name="isPlanned"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row items-center gap-3">
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: "#CBD5E1", true: "#10B981" }}
                thumbColor="#FFFFFF"
              />
              <Text className="text-sm text-slate-600 dark:text-slate-300">
                {value
                  ? t("plantEvent.form.plannedYes")
                  : t("plantEvent.form.plannedNo")}
              </Text>
            </View>
          )}
        />
      </FormField>

      {/* Description */}
      <FormField label={t("plantEvent.form.description")}>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="min-h-[80px] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white"
              placeholder={t("plantEvent.form.descriptionPlaceholder")}
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
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
