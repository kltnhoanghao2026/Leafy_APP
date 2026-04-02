import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

import { FarmPlotPickerModal } from "./FarmPlotPickerModal";
import { SpeciesPickerModal } from "./SpeciesPickerModal";
import { PLANT_STATUS_VALUES } from "./plant.types";
import { usePlantFormScreen } from "../hooks/usePlantFormScreen";

const toDateInputValue = (value?: string): Date => {
  if (!value) return new Date();

  const normalizedDate = value.includes("T") ? value.split("T")[0] : value;
  const parsedDate = new Date(`${normalizedDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }

  return parsedDate;
};

const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export function PlantFormScreen() {
  const { t } = useTranslation();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSpeciesPickerVisible, setIsSpeciesPickerVisible] = useState(false);
  const [isFarmPlotPickerVisible, setIsFarmPlotPickerVisible] = useState(false);
  const [isPlantingDatePickerVisible, setIsPlantingDatePickerVisible] =
    useState(false);
  const [isGerminationDatePickerVisible, setIsGerminationDatePickerVisible] =
    useState(false);
  const [
    isActualHarvestDatePickerVisible,
    setIsActualHarvestDatePickerVisible,
  ] = useState(false);

  const {
    control,
    errors,
    isLoading,
    canSubmit,
    isEditMode,
    isEditingPlantLoading,
    isEditingPlantError,
    refetchEditingPlant,
    formTitle,
    submitButtonLabel,
    handleSubmit,
    onSubmit,
    handleCancel,
    speciesOptions,
    isSpeciesLoading,
    isSpeciesError,
    refetchSpecies,
    selectedSpeciesId,
    selectedSpeciesLabel,
    handleSelectSpecies,
    farmPlotOptions,
    isFarmPlotsLoading,
    isFarmPlotsError,
    refetchFarmPlots,
    selectedFarmPlotId,
    selectedFarmPlotLabel,
    handleSelectFarmPlot,
    routeFarmName,
  } = usePlantFormScreen();

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
        <View className="mb-1">
          <Text className="text-[26px] font-[800] tracking-[-0.4px] text-slate-900 dark:text-white">
            {formTitle}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
            {isEditMode
              ? t("plant.form.subtitleEdit")
              : t("plant.form.subtitleCreate")}
          </Text>
          {routeFarmName ? (
            <Text className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {t("plant.form.targetFarm", { name: routeFarmName })}
            </Text>
          ) : null}
        </View>

        {isEditMode && isEditingPlantLoading ? (
          <View className="border border-red-500/35 rounded-xl px-3 py-2.5 bg-red-500/10">
            <Text className="text-red-700 dark:text-red-500 text-[13px] font-semibold">
              {t("plant.form.loadingEditData")}
            </Text>
          </View>
        ) : null}

        {isEditMode && isEditingPlantError ? (
          <View className="border border-red-500/35 rounded-xl px-3 py-2.5 bg-red-500/10">
            <Text className="text-red-700 dark:text-red-500 text-[13px] font-semibold">
              {t("plant.form.loadEditDataFailed")}
            </Text>
            <TouchableOpacity onPress={() => void refetchEditingPlant()}>
              <Text className="text-green-600 dark:text-green-400 mt-1.5 font-bold text-[13px]">
                {t("common.retry")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {errors.root?.message ? (
          <View className="border border-red-500/35 rounded-xl px-3 py-2.5 bg-red-500/10">
            <Text className="text-red-700 dark:text-red-500 text-[13px] font-semibold">
              {errors.root.message}
            </Text>
          </View>
        ) : null}

        <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Text className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            {t("plant.form.coreSection")}
          </Text>

          <View className="gap-3">
            <View>
              <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
                {t("plant.form.plantNumber")}
              </Text>
              <Controller
                control={control}
                name="plantNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                    placeholder={t("plant.form.plantNumberPlaceholder")}
                    placeholderTextColor="#9ca3af"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.plantNumber ? (
                <Text className="text-red-500 text-xs mt-1 font-semibold">
                  {errors.plantNumber.message}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
                {t("plant.form.plantStatus")}
              </Text>
              <Controller
                control={control}
                name="plantStatus"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {PLANT_STATUS_VALUES.map((status) => {
                      const isSelected = value === status;

                      return (
                        <TouchableOpacity
                          key={status}
                          className={`rounded-full border px-3.5 py-2 ${isSelected ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/25" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}
                          onPress={() => onChange(status)}
                        >
                          <Text
                            className={`text-xs font-bold ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}`}
                          >
                            {t(
                              `plant.form.statusOptions.${status.toLowerCase()}`,
                            )}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />
              {errors.plantStatus ? (
                <Text className="text-red-500 text-xs mt-1 font-semibold">
                  {errors.plantStatus.message}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
                {t("plant.form.species")}
              </Text>
              <TouchableOpacity
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 justify-center bg-white dark:bg-slate-900"
                onPress={() => setIsSpeciesPickerVisible(true)}
                disabled={isSpeciesLoading}
              >
                {isSpeciesLoading ? (
                  <Text className="text-sm text-slate-500 dark:text-slate-400">
                    {t("plant.form.speciesLoading")}
                  </Text>
                ) : (
                  <Text
                    className={`text-sm font-medium ${selectedSpeciesLabel ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                  >
                    {selectedSpeciesLabel || t("plant.form.speciesPlaceholder")}
                  </Text>
                )}
              </TouchableOpacity>
              {isSpeciesError ? (
                <TouchableOpacity onPress={() => void refetchSpecies()}>
                  <Text className="text-xs mt-1 font-semibold text-red-500">
                    {t("plant.form.speciesLoadFailed")}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {errors.speciesId ? (
                <Text className="text-red-500 text-xs mt-1 font-semibold">
                  {errors.speciesId.message}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
                {t("plant.form.farmPlotId")}
              </Text>
              <Controller
                control={control}
                name="farmPlotId"
                render={() => (
                  <TouchableOpacity
                    className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 justify-center bg-white dark:bg-slate-900"
                    onPress={() => setIsFarmPlotPickerVisible(true)}
                    disabled={isFarmPlotsLoading}
                  >
                    {isFarmPlotsLoading ? (
                      <Text className="text-sm text-slate-500 dark:text-slate-400">
                        {t("plant.form.farmPlotLoading")}
                      </Text>
                    ) : (
                      <Text
                        className={`text-sm font-medium ${selectedFarmPlotLabel ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                      >
                        {selectedFarmPlotLabel ||
                          t("plant.form.farmPlotIdPlaceholder")}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              />
              {isFarmPlotsError ? (
                <TouchableOpacity onPress={() => void refetchFarmPlots()}>
                  <Text className="text-xs mt-1 font-semibold text-red-500">
                    {t("plant.form.farmPlotLoadFailed")}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {errors.farmPlotId ? (
                <Text className="text-red-500 text-xs mt-1 font-semibold">
                  {errors.farmPlotId.message}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
                {t("plant.form.plantingDate")}
              </Text>
              <Controller
                control={control}
                name="plantingDate"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <TouchableOpacity
                      className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                      onPress={() => setIsPlantingDatePickerVisible(true)}
                    >
                      <Text
                        className={`text-sm font-medium ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                      >
                        {value || t("plant.form.datePlaceholder")}
                      </Text>
                      <CalendarDays
                        size={18}
                        className="text-slate-400 dark:text-slate-500"
                      />
                    </TouchableOpacity>

                    {isPlantingDatePickerVisible ? (
                      <DateTimePicker
                        value={toDateInputValue(value)}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(_, selectedDate) => {
                          setIsPlantingDatePickerVisible(false);

                          if (selectedDate) {
                            onChange(formatDateOnly(selectedDate));
                          }
                        }}
                      />
                    ) : null}
                  </View>
                )}
              />
              {errors.plantingDate ? (
                <Text className="text-red-500 text-xs mt-1 font-semibold">
                  {errors.plantingDate.message}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex-row items-center justify-between dark:border-slate-800 dark:bg-slate-900"
          onPress={() => setIsAdvancedOpen((previous) => !previous)}
        >
          <Text className="text-sm font-bold text-slate-900 dark:text-white">
            {t("plant.form.advancedSection")}
          </Text>
          {isAdvancedOpen ? (
            <ChevronUp
              size={18}
              className="text-slate-500 dark:text-slate-400"
            />
          ) : (
            <ChevronDown
              size={18}
              className="text-slate-500 dark:text-slate-400"
            />
          )}
        </TouchableOpacity>

        {isAdvancedOpen ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <View className="gap-3">
              {[
                [
                  "nickName",
                  "plant.form.nickName",
                  "plant.form.nickNamePlaceholder",
                ],
                [
                  "tagCode",
                  "plant.form.tagCode",
                  "plant.form.tagCodePlaceholder",
                ],
                [
                  "batchNumber",
                  "plant.form.batchNumber",
                  "plant.form.batchNumberPlaceholder",
                ],
                [
                  "sourceType",
                  "plant.form.sourceType",
                  "plant.form.sourceTypePlaceholder",
                ],
                [
                  "motherPlantId",
                  "plant.form.motherPlantId",
                  "plant.form.motherPlantIdPlaceholder",
                ],
              ].map(([name, labelKey, placeholderKey]) => (
                <View key={name}>
                  <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
                    {t(labelKey)}
                  </Text>
                  <Controller
                    control={control}
                    name={name as never}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                        placeholder={t(placeholderKey)}
                        placeholderTextColor="#9ca3af"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value as string}
                      />
                    )}
                  />
                  {errors[name as keyof typeof errors] ? (
                    <Text className="text-red-500 text-xs mt-1 font-semibold">
                      {String(
                        errors[name as keyof typeof errors]?.message ?? "",
                      )}
                    </Text>
                  ) : null}
                </View>
              ))}

              <View>
                <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
                  {t("plant.form.germinationDate")}
                </Text>
                <Controller
                  control={control}
                  name="germinationDate"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <TouchableOpacity
                        className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                        onPress={() => setIsGerminationDatePickerVisible(true)}
                      >
                        <Text
                          className={`text-sm font-medium ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                        >
                          {value || t("plant.form.datePlaceholder")}
                        </Text>
                        <CalendarDays
                          size={18}
                          className="text-slate-400 dark:text-slate-500"
                        />
                      </TouchableOpacity>

                      {isGerminationDatePickerVisible ? (
                        <DateTimePicker
                          value={toDateInputValue(value)}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={(_, selectedDate) => {
                            setIsGerminationDatePickerVisible(false);

                            if (selectedDate) {
                              onChange(formatDateOnly(selectedDate));
                            }
                          }}
                        />
                      ) : null}
                    </View>
                  )}
                />
                {errors.germinationDate ? (
                  <Text className="text-red-500 text-xs mt-1 font-semibold">
                    {errors.germinationDate.message}
                  </Text>
                ) : null}
              </View>

              <View>
                <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
                  {t("plant.form.actualHarvestDate")}
                </Text>
                <Controller
                  control={control}
                  name="actualHarvestDate"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <TouchableOpacity
                        className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
                        onPress={() =>
                          setIsActualHarvestDatePickerVisible(true)
                        }
                      >
                        <Text
                          className={`text-sm font-medium ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                        >
                          {value || t("plant.form.datePlaceholder")}
                        </Text>
                        <CalendarDays
                          size={18}
                          className="text-slate-400 dark:text-slate-500"
                        />
                      </TouchableOpacity>

                      {isActualHarvestDatePickerVisible ? (
                        <DateTimePicker
                          value={toDateInputValue(value)}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={(_, selectedDate) => {
                            setIsActualHarvestDatePickerVisible(false);

                            if (selectedDate) {
                              onChange(formatDateOnly(selectedDate));
                            }
                          }}
                        />
                      ) : null}
                    </View>
                  )}
                />
                {errors.actualHarvestDate ? (
                  <Text className="text-red-500 text-xs mt-1 font-semibold">
                    {errors.actualHarvestDate.message}
                  </Text>
                ) : null}
              </View>

              <View>
                <Text className="text-[13px] font-semibold mb-1 text-slate-900 dark:text-white">
                  {t("plant.form.totalYieldKg")}
                </Text>
                <Controller
                  control={control}
                  name="totalYieldKg"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                      placeholder={t("plant.form.totalYieldKgPlaceholder")}
                      placeholderTextColor="#9ca3af"
                      keyboardType="decimal-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value as string}
                    />
                  )}
                />
                {errors.totalYieldKg ? (
                  <Text className="text-red-500 text-xs mt-1 font-semibold">
                    {errors.totalYieldKg.message}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="h-[46px] rounded-full flex-1 items-center justify-center flex-row gap-1.5 border border-green-800/10 dark:border-green-400/10 bg-transparent"
            onPress={handleCancel}
            disabled={isLoading}
          >
            <X size={16} className="text-slate-900 dark:text-white" />
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`h-[46px] rounded-full flex-1 items-center justify-center flex-row gap-1.5 border-0 ${canSubmit ? "bg-green-600" : "bg-slate-500 dark:bg-slate-400"}`}
            onPress={handleSubmit(onSubmit)}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={16} color="#FFFFFF" />
                <Text className="text-white text-sm font-bold">
                  {submitButtonLabel}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <SpeciesPickerModal
          visible={isSpeciesPickerVisible}
          options={speciesOptions}
          selectedSpeciesId={selectedSpeciesId}
          isLoading={isSpeciesLoading}
          onClose={() => setIsSpeciesPickerVisible(false)}
          onSelect={(speciesId) => {
            handleSelectSpecies(speciesId);
            setIsSpeciesPickerVisible(false);
          }}
        />

        <FarmPlotPickerModal
          visible={isFarmPlotPickerVisible}
          options={farmPlotOptions}
          selectedFarmPlotId={selectedFarmPlotId}
          isLoading={isFarmPlotsLoading}
          onClose={() => setIsFarmPlotPickerVisible(false)}
          onSelect={(farmPlotId) => {
            handleSelectFarmPlot(farmPlotId);
            setIsFarmPlotPickerVisible(false);
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
