import { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, X } from "lucide-react-native";
import { BottomSheetScrollView, BottomSheetModal } from "@gorhom/bottom-sheet";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { BaseBottomSheet } from "@/src/shared/components/BaseBottomSheet";
import { FormField } from "@/src/components/ui/FormField";
import type { FarmZoneResponse } from "./farm.types";

export type ZonePayload = {
  zoneName: string;
  zoneCode: string;
  description?: string;
  areaM2?: number;
  soilType?: string;
  cropType?: string;
  plantingDate?: string;
  elevationM?: number;
};

type Props = {
  visible: boolean;
  mode: "create" | "edit";
  plotName?: string;
  initialZone?: FarmZoneResponse | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ZonePayload) => Promise<void> | void;
};

type FormValues = {
  zoneName: string;
  zoneCode: string;
  description?: string;
  areaM2?: string;
  soilType?: string;
  cropType?: string;
  plantingDate?: string;
  elevationM?: string;
};

export function FarmZoneFormModal({
  visible,
  mode,
  plotName,
  initialZone,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const zoneSchema = useMemo(
    () =>
      z.object({
        zoneName: z.string().min(1, t("farm.validation.zoneNameRequired")),
        zoneCode: z.string().min(1, t("farm.validation.zoneCodeRequired")),
        description: z.string().optional(),
        areaM2: z.string().optional(),
        soilType: z.string().optional(),
        cropType: z.string().optional(),
        plantingDate: z.string().optional(),
        elevationM: z.string().optional(),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      zoneName: "",
      zoneCode: "",
      description: "",
      areaM2: "",
      soilType: "",
      cropType: "",
      plantingDate: "",
      elevationM: "",
    },
  });

  useEffect(() => {
    if (visible) {
      if (mode === "edit" && initialZone) {
        reset({
          zoneName: initialZone.zoneName ?? "",
          zoneCode: initialZone.zoneCode ?? "",
          description: initialZone.description ?? "",
          areaM2: initialZone.areaM2 != null ? String(initialZone.areaM2) : "",
          soilType: initialZone.soilType ?? "",
          cropType: initialZone.cropType ?? "",
          plantingDate: initialZone.plantingDate ?? "",
          elevationM:
            initialZone.elevationM != null
              ? String(initialZone.elevationM)
              : "",
        });
      } else {
        reset({
          zoneName: "",
          zoneCode: "",
          description: "",
          areaM2: "",
          soilType: "",
          cropType: "",
          plantingDate: "",
          elevationM: "",
        });
      }
      // Give small delay for layout calculation
      setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 50);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, mode, initialZone, reset]);

  const onValid = async (data: FormValues) => {
    const payload: ZonePayload = {
      zoneName: data.zoneName.trim(),
      zoneCode: data.zoneCode.trim(),
      description: data.description?.trim() || undefined,
      areaM2: data.areaM2 ? Number(data.areaM2) : undefined,
      soilType: data.soilType?.trim() || undefined,
      cropType: data.cropType?.trim() || undefined,
      plantingDate: data.plantingDate?.trim() || undefined,
      elevationM: data.elevationM ? Number(data.elevationM) : undefined,
    };
    await onSubmit(payload);
  };

  const modalTitle =
    mode === "create"
      ? t("farm.zoneForm.titleCreate")
      : t("farm.zoneForm.titleEdit");
  const submitLabel =
    mode === "create"
      ? t("farm.zoneForm.submitCreate")
      : t("farm.zoneForm.submitEdit");

  return (
    <BaseBottomSheet
      ref={bottomSheetRef}
      onClose={onClose}
      snapPoints={["90%"]}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-lg font-bold text-slate-900 dark:text-white">
          {modalTitle}
        </Text>
        <TouchableOpacity
          className="w-8 h-8 rounded-full items-center justify-center bg-slate-400/15"
          onPress={onClose}
        >
          <X size={18} className="text-slate-500 dark:text-slate-400" />
        </TouchableOpacity>
      </View>

      {plotName && (
        <Text className="text-sm mb-2 text-slate-500 dark:text-slate-400">
          {t("farm.zoneForm.plotName", { name: plotName })}
        </Text>
      )}

      <BottomSheetScrollView
        className="max-h-[460px]"
        showsVerticalScrollIndicator={false}
      >
        <FormField
          label={t("farm.zoneForm.zoneName")}
          error={errors.zoneName?.message}
        >
          <Controller
            control={control}
            name="zoneName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                placeholder={t("farm.zoneForm.zoneNamePlaceholder")}
                placeholderTextColor="#9ca3af"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </FormField>

        <View className="h-3" />

        <FormField
          label={t("farm.zoneForm.zoneCode")}
          error={errors.zoneCode?.message}
        >
          <Controller
            control={control}
            name="zoneCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                placeholder={t("farm.zoneForm.zoneCodePlaceholder")}
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </FormField>

        <View className="h-3" />

        <FormField label={t("farm.zoneForm.description")}>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="min-h-[84px] border border-slate-200 dark:border-slate-800 rounded-xl px-3 pt-2.5 text-sm font-medium text-slate-900 dark:text-white"
                placeholder={t("farm.zoneForm.descriptionPlaceholder")}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </FormField>

        <View className="h-3" />

        <FormField label={t("farm.zoneForm.area")}>
          <Controller
            control={control}
            name="areaM2"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                placeholder={t("farm.zoneForm.areaPlaceholder")}
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </FormField>

        <View className="h-3" />

        <FormField label={t("farm.zoneForm.soilType")}>
          <Controller
            control={control}
            name="soilType"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                placeholder={t("farm.zoneForm.soilTypePlaceholder")}
                placeholderTextColor="#9ca3af"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </FormField>

        <View className="h-3" />

        <FormField label={t("farm.zoneForm.cropType")}>
          <Controller
            control={control}
            name="cropType"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                placeholder={t("farm.zoneForm.cropTypePlaceholder")}
                placeholderTextColor="#9ca3af"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </FormField>

        <View className="h-3" />

        <FormField label={t("farm.zoneForm.plantingDate")}>
          <Controller
            control={control}
            name="plantingDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                placeholder={t("farm.zoneForm.plantingDatePlaceholder")}
                placeholderTextColor="#9ca3af"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </FormField>

        <View className="h-3" />

        <FormField label={t("farm.zoneForm.elevation")}>
          <Controller
            control={control}
            name="elevationM"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white"
                placeholder={t("farm.zoneForm.elevationPlaceholder")}
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </FormField>
      </BottomSheetScrollView>

      <View className="flex-row gap-2.5 mt-3">
        <TouchableOpacity
          className="flex-1 h-11 rounded-full items-center justify-center flex-row gap-1.5 border border-slate-200 dark:border-slate-800"
          onPress={onClose}
          disabled={isSubmitting}
        >
          <Text className="text-slate-900 dark:text-white font-semibold">
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 h-11 rounded-full items-center justify-center flex-row gap-1.5 bg-green-600 dark:bg-green-500"
          onPress={() => void handleSubmit(onValid)()}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={16} color="#FFFFFF" />
              <Text className="text-white font-semibold">{submitLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </BaseBottomSheet>
  );
}
