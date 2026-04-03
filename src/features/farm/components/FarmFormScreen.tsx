import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { ErrorAlert } from "@/src/components/ui/ErrorAlert";
import { useFarmFormScreen } from "../hooks/useFarmFormScreen";
import { FarmFormDetailsCard } from "./FarmFormDetailsCard";
import type { ActivePicker } from "./FarmFormDetailsCard";
import { FarmAdministrativePickerModal } from "./FarmAdministrativePickerModal";

export function FarmFormScreen() {
  const { t } = useTranslation();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const {
    control,
    errors,
    isLoading,
    isEditMode,
    isEditingPlotLoading,
    isEditingPlotError,
    refetchEditingPlot,
    canSubmit,
    formTitle,
    submitButtonLabel,
    handleSubmit,
    onSubmit,
    handleCancel,
    isLocating,
    handleUseMyLocation,
    provinceCode,
    districtCode,
    wardCode,
    provinceOptions,
    districtOptions,
    wardOptions,
    isProvinceOptionsLoading,
    isDistrictOptionsLoading,
    isWardOptionsLoading,
    handleSelectProvinceCode,
    handleSelectDistrictCode,
    handleSelectWardCode,
  } = useFarmFormScreen();

  const handlePickOption = async (code: string) => {
    if (activePicker === "province") {
      await handleSelectProvinceCode(code);
    }

    if (activePicker === "district") {
      await handleSelectDistrictCode(code);
    }

    if (activePicker === "ward") {
      handleSelectWardCode(code);
    }

    setActivePicker(null);
  };

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
              ? t("farm.form.subtitleEdit")
              : t("farm.form.subtitleCreate")}
          </Text>
        </View>

        {isEditMode && isEditingPlotLoading ? (
          <ErrorAlert message={t("farm.form.loadingEditData")} />
        ) : null}

        {isEditMode && isEditingPlotError ? (
          <ErrorAlert
            message={t("farm.form.loadEditDataFailed")}
            onRetry={() => void refetchEditingPlot()}
          />
        ) : null}

        {errors.root?.message ? (
          <ErrorAlert message={errors.root.message} />
        ) : null}

        <FarmFormDetailsCard
          setActivePicker={setActivePicker}
          control={control}
          errors={errors}
          isLoading={isLoading}
          isLocating={isLocating}
          handleUseMyLocation={handleUseMyLocation}
          provinceCode={provinceCode}
          districtCode={districtCode}
          wardCode={wardCode}
          provinceOptions={provinceOptions}
          districtOptions={districtOptions}
          wardOptions={wardOptions}
          isProvinceOptionsLoading={isProvinceOptionsLoading}
          isDistrictOptionsLoading={isDistrictOptionsLoading}
          isWardOptionsLoading={isWardOptionsLoading}
        />

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

        <FarmAdministrativePickerModal
          visible={activePicker !== null}
          activePicker={activePicker}
          provinceOptions={provinceOptions}
          districtOptions={districtOptions}
          wardOptions={wardOptions}
          isProvinceOptionsLoading={isProvinceOptionsLoading}
          isDistrictOptionsLoading={isDistrictOptionsLoading}
          isWardOptionsLoading={isWardOptionsLoading}
          onClose={() => setActivePicker(null)}
          onSelect={handlePickOption}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
