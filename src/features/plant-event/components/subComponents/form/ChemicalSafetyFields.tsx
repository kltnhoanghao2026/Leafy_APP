import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@/src/components/ui/FormField";

interface ChemicalSafetyFieldsProps {
  control: any;
  errors: any;
  isOpen: boolean;
  onToggle: () => void;
  isTreatment: boolean;
}

export function ChemicalSafetyFields({
  control,
  errors,
  isOpen,
  onToggle,
  isTreatment,
}: ChemicalSafetyFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <TouchableOpacity
        className={`rounded-xl border px-4 py-3 flex-row items-center justify-between ${
          isTreatment
            ? "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20"
            : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        }`}
        onPress={onToggle}
      >
        <Text
          className={`text-sm font-bold ${isTreatment ? "text-orange-700 dark:text-orange-400" : "text-slate-900 dark:text-white"}`}
        >
          {t("plantEvent.form.chemicalSection")}
        </Text>
        {isOpen ? (
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

      {isOpen ? (
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
                    placeholder={t("plantEvent.form.estimatedCostPlaceholder")}
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
    </>
  );
}
