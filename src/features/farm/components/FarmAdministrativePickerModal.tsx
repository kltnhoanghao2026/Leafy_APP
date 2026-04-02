import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import type { AdministrativeOption } from "../hooks/useFarmFormScreen";
import type { ActivePicker } from "./FarmFormDetailsCard";

type Props = {
  visible: boolean;
  activePicker: ActivePicker;
  provinceOptions: AdministrativeOption[];
  districtOptions: AdministrativeOption[];
  wardOptions: AdministrativeOption[];
  isProvinceOptionsLoading: boolean;
  isDistrictOptionsLoading: boolean;
  isWardOptionsLoading: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
};

export function FarmAdministrativePickerModal({
  visible,
  activePicker,
  provinceOptions,
  districtOptions,
  wardOptions,
  isProvinceOptionsLoading,
  isDistrictOptionsLoading,
  isWardOptionsLoading,
  onClose,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const pickerOptions =
    activePicker === "province"
      ? provinceOptions
      : activePicker === "district"
        ? districtOptions
        : wardOptions;

  const isPickerLoading =
    activePicker === "province"
      ? isProvinceOptionsLoading
      : activePicker === "district"
        ? isDistrictOptionsLoading
        : isWardOptionsLoading;

  const pickerTitle =
    activePicker === "province"
      ? t("farm.form.selectProvince")
      : activePicker === "district"
        ? t("farm.form.selectDistrict")
        : t("farm.form.selectWard");

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-slate-950/45 justify-center px-4"
        onPress={onClose}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="border rounded-2xl max-h-[70%] px-3 py-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        >
          <Text className="text-base font-bold mb-2.5 text-slate-900 dark:text-white">
            {pickerTitle}
          </Text>

          {isPickerLoading ? (
            <View className="flex-row items-center gap-2 py-2">
              <ActivityIndicator
                size="small"
                className="text-green-600 dark:text-green-400"
              />
              <Text className="text-slate-500 dark:text-slate-400 text-[13px]">
                {t("common.loading")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={pickerOptions}
              keyExtractor={(item) => item.code}
              className="max-h-[360px]"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-2.5 border-b border-slate-400/20 flex-row items-center justify-between gap-2"
                  onPress={() => onSelect(item.code)}
                >
                  <Text className="text-slate-900 dark:text-white text-sm">
                    {item.name}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    {item.code}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="text-slate-500 dark:text-slate-400 text-[13px] text-center mt-4">
                  {t("farm.form.noData")}
                </Text>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
