import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react-native";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { ErrorAlert } from "@/src/components/ui/ErrorAlert";
import { FormField } from "@/src/components/ui/FormField";
import { FormSection } from "@/src/components/ui/FormSection";
import { toDateInputValue, formatDateOnly } from "@/src/utils/date";
import { EventTypePickerModal } from "./EventTypePickerModal";
import type { EventType } from "./plant-event.types";
import { getEventCategoryColors, getEventTypeIcon } from "./plant-event.types";
import { usePlantEventFormScreen } from "../hooks/usePlantEventFormScreen";

export function PlantEventFormScreen() {
  const { t } = useTranslation();
  const [isEventTypePickerVisible, setIsEventTypePickerVisible] =
    useState(false);
  const [isChemicalOpen, setIsChemicalOpen] = useState(false);
  const [isStartDatePickerVisible, setIsStartDatePickerVisible] =
    useState(false);
  const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState(false);

  const {
    control,
    errors,
    isLoading,
    canSubmit,
    isEditMode,
    isEditingEventLoading,
    isEditingEventError,
    refetchEditingEvent,
    formTitle,
    submitButtonLabel,
    handleSubmit,
    onSubmit,
    handleCancel,
    selectedEventType,
    handleSelectEventType,
    routeTargetType,
    targetLabel,
  } = usePlantEventFormScreen();

  const isTreatment = selectedEventType === "TREATMENT_APPLICATION";

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-[#020617]"
        contentContainerClassName="flex-grow px-4 pt-4 pb-7 gap-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-1">
          <Text className="text-[26px] font-[800] tracking-[-0.4px] text-slate-900 dark:text-white">
            {formTitle}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
            {isEditMode
              ? t("plantEvent.form.subtitleEdit")
              : t("plantEvent.form.subtitleCreate")}
          </Text>
          {targetLabel ? (
            <Text className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {routeTargetType === "FARM_PLOT"
                ? t("plantEvent.form.targetFarmPlot", { name: targetLabel })
                : routeTargetType === "FARM_ZONE"
                  ? t("plantEvent.form.targetFarmZone", { name: targetLabel })
                  : t("plantEvent.form.targetPlant", { name: targetLabel })}
            </Text>
          ) : null}
        </View>

        {/* Edit loading / error states */}
        {isEditMode && isEditingEventLoading ? (
          <ErrorAlert message={t("plantEvent.form.loadingEditData")} />
        ) : null}

        {isEditMode && isEditingEventError ? (
          <ErrorAlert
            message={t("plantEvent.form.loadEditDataFailed")}
            onRetry={() => void refetchEditingEvent()}
          />
        ) : null}

        {errors.root?.message ? (
          <ErrorAlert message={errors.root.message} />
        ) : null}

        {/* ── Core Section ─────────────────────────────────────────────── */}
        <FormSection title={t("plantEvent.form.coreSection")}>
          {/* Event type picker */}
          <FormField
            label={t("plantEvent.form.eventType")}
            error={errors.eventType?.message}
          >
            <TouchableOpacity
              className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center bg-white dark:bg-slate-900"
              onPress={() => setIsEventTypePickerVisible(true)}
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
        </FormSection>

        {/* ── Date & Duration Section ──────────────────────────────────── */}
        <FormSection title={t("plantEvent.form.dateSection")}>
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

          {/* Days from now */}
          <FormField
            label={t("plantEvent.form.daysFromNow")}
            error={errors.daysFromNow?.message}
          >
            <Controller
              control={control}
              name="daysFromNow"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                  placeholder={t("plantEvent.form.daysFromNowPlaceholder")}
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
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
        </FormSection>

        {/* ── Chemical Safety Section (Collapsible) ────────────────────── */}
        <TouchableOpacity
          className={`rounded-xl border px-4 py-3 flex-row items-center justify-between ${
            isTreatment
              ? "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20"
              : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          }`}
          onPress={() => setIsChemicalOpen((prev) => !prev)}
        >
          <Text
            className={`text-sm font-bold ${isTreatment ? "text-orange-700 dark:text-orange-400" : "text-slate-900 dark:text-white"}`}
          >
            {t("plantEvent.form.chemicalSection")}
          </Text>
          {isChemicalOpen ? (
            <ChevronUp
              size={18}
              className={
                isTreatment
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-slate-500 dark:text-slate-400"
              }
            />
          ) : (
            <ChevronDown
              size={18}
              className={
                isTreatment
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-slate-500 dark:text-slate-400"
              }
            />
          )}
        </TouchableOpacity>

        {isChemicalOpen ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <View className="gap-3">
              {/* PHI Days */}
              <FormField
                label={t("plantEvent.form.phiDays")}
                error={errors.phiDays?.message}
              >
                <Controller
                  control={control}
                  name="phiDays"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                      placeholder={t("plantEvent.form.phiDaysPlaceholder")}
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </FormField>

              {/* PPE Required */}
              <FormField label={t("plantEvent.form.ppeRequired")}>
                <Controller
                  control={control}
                  name="ppeRequired"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                      placeholder={t("plantEvent.form.ppeRequiredPlaceholder")}
                      placeholderTextColor="#9ca3af"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </FormField>

              {/* MRL Note */}
              <FormField label={t("plantEvent.form.mrlNote")}>
                <Controller
                  control={control}
                  name="mrlNote"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="min-h-[60px] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white"
                      placeholder={t("plantEvent.form.mrlNotePlaceholder")}
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

              {/* Estimated Cost */}
              <FormField label={t("plantEvent.form.estimatedCost")}>
                <Controller
                  control={control}
                  name="estimatedCost"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                      placeholder={t(
                        "plantEvent.form.estimatedCostPlaceholder",
                      )}
                      placeholderTextColor="#9ca3af"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </FormField>
            </View>
          </View>
        ) : null}

        {/* ── Action Buttons ───────────────────────────────────────────── */}
        <View className="gap-3 pt-2">
          <TouchableOpacity
            className={`h-[46px] items-center justify-center rounded-full ${canSubmit ? "bg-green-600" : "bg-slate-500"}`}
            onPress={handleSubmit(onSubmit)}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-[15px] font-bold text-white">
                {submitButtonLabel}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="h-[46px] items-center justify-center rounded-full border border-green-800/10 bg-transparent"
            onPress={handleCancel}
          >
            <Text className="text-[15px] font-bold text-slate-600 dark:text-slate-300">
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Modals ──────────────────────────────────────────────────── */}
        <EventTypePickerModal
          visible={isEventTypePickerVisible}
          selectedEventType={selectedEventType}
          onClose={() => setIsEventTypePickerVisible(false)}
          onSelect={(eventType) => {
            handleSelectEventType(eventType);
            setIsEventTypePickerVisible(false);
            // Auto-expand chemical section for treatment
            if (eventType === "TREATMENT_APPLICATION") {
              setIsChemicalOpen(true);
            }
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
