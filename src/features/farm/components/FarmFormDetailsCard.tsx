import { Controller } from "react-hook-form";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChevronDown, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "@/src/hooks/useColorScheme";

import type {
  AdministrativeOption,
  UseFarmFormScreenResult,
} from "../hooks/useFarmFormScreen";

export type ActivePicker = "province" | "district" | "ward" | null;

type Props = Pick<
  UseFarmFormScreenResult,
  | "control"
  | "errors"
  | "isLoading"
  | "isLocating"
  | "handleUseMyLocation"
  | "provinceCode"
  | "districtCode"
  | "wardCode"
  | "provinceOptions"
  | "districtOptions"
  | "wardOptions"
  | "isProvinceOptionsLoading"
  | "isDistrictOptionsLoading"
  | "isWardOptionsLoading"
> & {
  setActivePicker: (picker: ActivePicker) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text className="text-red-600 mt-1 text-xs font-medium">{message}</Text>
  );
}

const resolveLabelByCode = (
  code: string,
  options: AdministrativeOption[],
  fallback: string,
) => {
  if (!code) return fallback;
  const found = options.find((option) => option.code === code);
  if (!found) return code;
  return `${found.name} (${found.code})`;
};

export function FarmFormDetailsCard({
  setActivePicker,
  control,
  errors,
  isLoading,
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
}: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <View className="border rounded-[20px] p-4 bg-white dark:bg-slate-900 border-green-800/10 dark:border-green-400/10">
      <Text className="text-base font-bold mb-3 text-slate-900 dark:text-white">
        {t("farm.form.mainInfo")}
      </Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <View className="mb-3">
            <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
              {t("farm.form.farmName")}
            </Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("farm.form.farmNamePlaceholder")}
              placeholderTextColor="#94A3B8"
              className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent"
            />
            <FieldError message={errors.name?.message} />
          </View>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <View className="mb-3">
            <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
              {t("farm.form.description")}
            </Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder={t("farm.form.descriptionPlaceholder")}
              placeholderTextColor="#94A3B8"
              className="min-h-[90px] h-[90px] pt-2.5 border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent"
            />
            <FieldError message={errors.description?.message} />
          </View>
        )}
      />

      <Controller
        control={control}
        name="areaM2"
        render={({ field: { value, onChange, onBlur } }) => (
          <View className="mb-3">
            <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
              {t("farm.form.area")}
            </Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              placeholder={t("farm.form.areaPlaceholder")}
              placeholderTextColor="#94A3B8"
              className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent"
            />
            <FieldError message={errors.areaM2?.message} />
          </View>
        )}
      />

      <View className="mt-2.5 mb-3 flex-row items-center justify-between gap-2">
        <Text className="text-base font-bold text-slate-900 dark:text-white m-0">
          {t("farm.form.location")}
        </Text>

        <TouchableOpacity
          className="flex-row items-center justify-center border rounded-full px-3 h-8 gap-1.5 border-green-800/10 dark:border-green-400/10 bg-green-800/10 dark:bg-green-400/10"
          onPress={handleUseMyLocation}
          disabled={isLocating || isLoading}
        >
          {isLocating ? (
            <ActivityIndicator
              size="small"
              className="text-green-600 dark:text-green-400"
            />
          ) : (
            <MapPin size={14} color={isDark ? "#4ade80" : "#16a34a"} />
          )}
          <Text className="text-xs font-bold text-green-600 dark:text-green-400">
            {t("farm.form.useMyLocation")}
          </Text>
        </TouchableOpacity>
      </View>

      <Controller
        control={control}
        name="addressLine"
        render={({ field: { value, onChange, onBlur } }) => (
          <View className="mb-3">
            <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
              {t("farm.form.addressLine")}
            </Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("farm.form.addressLinePlaceholder")}
              placeholderTextColor="#94A3B8"
              className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent"
            />
            <FieldError message={errors.addressLine?.message} />
          </View>
        )}
      />

      <View className="mb-3">
        <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
          {t("farm.form.province")}
        </Text>
        <TouchableOpacity
          onPress={() => setActivePicker("province")}
          className="h-[46px] border rounded-xl px-3 flex-row items-center gap-2 border-green-800/10 dark:border-green-400/10 bg-white dark:bg-slate-900"
        >
          <Text
            numberOfLines={1}
            className={`flex-1 ${provinceCode ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
          >
            {resolveLabelByCode(
              provinceCode,
              provinceOptions,
              t("farm.form.selectProvince"),
            )}
          </Text>
          {isProvinceOptionsLoading ? (
            <ActivityIndicator
              size="small"
              className="text-green-600 dark:text-green-400"
            />
          ) : (
            <ChevronDown
              size={18}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          )}
        </TouchableOpacity>
        <FieldError message={errors.provinceCode?.message} />
      </View>

      <View className="mb-3">
        <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
          {t("farm.form.district")}
        </Text>
        <TouchableOpacity
          onPress={() => setActivePicker("district")}
          disabled={!provinceCode}
          className={`h-[46px] border rounded-xl px-3 flex-row items-center gap-2 border-green-800/10 dark:border-green-400/10 ${!provinceCode ? "bg-slate-200/15 dark:bg-slate-800/15 opacity-65" : "bg-white dark:bg-slate-900"}`}
        >
          <Text
            numberOfLines={1}
            className={`flex-1 ${districtCode ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
          >
            {resolveLabelByCode(
              districtCode,
              districtOptions,
              provinceCode
                ? t("farm.form.selectDistrict")
                : t("farm.form.selectProvinceFirst"),
            )}
          </Text>
          {isDistrictOptionsLoading ? (
            <ActivityIndicator
              size="small"
              className="text-green-600 dark:text-green-400"
            />
          ) : (
            <ChevronDown
              size={18}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          )}
        </TouchableOpacity>
        <FieldError message={errors.districtCode?.message} />
      </View>

      <View className="mb-3">
        <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
          {t("farm.form.ward")}
        </Text>
        <TouchableOpacity
          onPress={() => setActivePicker("ward")}
          disabled={!districtCode}
          className={`h-[46px] border rounded-xl px-3 flex-row items-center gap-2 border-green-800/10 dark:border-green-400/10 ${!districtCode ? "bg-slate-200/15 dark:bg-slate-800/15 opacity-65" : "bg-white dark:bg-slate-900"}`}
        >
          <Text
            numberOfLines={1}
            className={`flex-1 ${wardCode ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
          >
            {resolveLabelByCode(
              wardCode,
              wardOptions,
              districtCode
                ? t("farm.form.selectWard")
                : t("farm.form.selectDistrictFirst"),
            )}
          </Text>
          {isWardOptionsLoading ? (
            <ActivityIndicator
              size="small"
              className="text-green-600 dark:text-green-400"
            />
          ) : (
            <ChevronDown
              size={18}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          )}
        </TouchableOpacity>
        <FieldError message={errors.wardCode?.message} />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="latitude"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-3">
                <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
                  {t("farm.form.latitude")}
                </Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="10.7769"
                  placeholderTextColor="#94A3B8"
                  className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent"
                />
                <FieldError message={errors.latitude?.message} />
              </View>
            )}
          />
        </View>

        <View className="flex-1">
          <Controller
            control={control}
            name="longitude"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-3">
                <Text className="text-[13px] font-semibold mb-1.5 text-slate-900 dark:text-white">
                  {t("farm.form.longitude")}
                </Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="106.7009"
                  placeholderTextColor="#94A3B8"
                  className="h-[46px] border rounded-xl px-3 text-sm font-medium text-slate-900 dark:text-white border-green-800/10 dark:border-green-400/10 bg-transparent"
                />
                <FieldError message={errors.longitude?.message} />
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
}
