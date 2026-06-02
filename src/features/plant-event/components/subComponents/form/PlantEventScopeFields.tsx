import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@/src/components/ui/FormField";
import type { TrackingGranularity } from "../../plant-event.types";

interface PlantEventScopeFieldsProps {
  routeTargetType: string;
  trackingGranularity: TrackingGranularity;
  exclusionsCount: number;
  onOpenExclusions: () => void;
  setValue: any;
}

export function PlantEventScopeFields({
  routeTargetType,
  trackingGranularity,
  exclusionsCount,
  onOpenExclusions,
  setValue,
}: PlantEventScopeFieldsProps) {
  const { t } = useTranslation();
  useFormContext();

  return (
    <>
      <FormField label={t("plantEvent.form.trackingGranularity", "Tracking Granularity")}>
        <View className="flex-row flex-wrap gap-2">
          {["NONE", ...(routeTargetType === "FARM_PLOT" ? ["ZONE", "PLANT"] : ["PLANT"])].map((granularity) => {
            const isActive = trackingGranularity === granularity;
            return (
              <TouchableOpacity
                key={granularity}
                className={`rounded-full border px-4 py-2 ${
                  isActive
                    ? "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/20"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                }`}
                onPress={() => setValue("trackingGranularity", granularity as TrackingGranularity, { shouldDirty: true })}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isActive
                      ? "text-green-700 dark:text-green-400"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {t(`plantEvent.form.granularity.${granularity}`, granularity)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </FormField>

      {trackingGranularity !== "NONE" && (
        <FormField label={t("plantEvent.form.exclusions", "Exclusions")}>
          <TouchableOpacity
            className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 flex-row items-center justify-between bg-white dark:bg-slate-900"
            onPress={onOpenExclusions}
          >
            <Text className="text-sm font-medium text-slate-900 dark:text-white">
              {exclusionsCount > 0
                ? t("plantEvent.form.excludedCount", { count: exclusionsCount })
                : t("plantEvent.form.noExclusions", "None")}
            </Text>
            <ChevronRight size={18} className="text-slate-400 dark:text-slate-500" />
          </TouchableOpacity>
        </FormField>
      )}
    </>
  );
}
