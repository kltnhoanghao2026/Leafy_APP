import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Search } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type FarmPlotOption = {
  id: string;
  label: string;
};

type Props = {
  visible: boolean;
  selectedFarmPlotId?: string;
  options: FarmPlotOption[];
  isLoading: boolean;
  onClose: () => void;
  onSelect: (farmPlotId: string) => void;
};

export function FarmPlotPickerModal({
  visible,
  selectedFarmPlotId,
  options,
  isLoading,
  onClose,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, searchQuery]);

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
          className="border rounded-2xl max-h-[72%] px-3 py-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        >
          <Text className="text-base font-bold mb-2.5 text-slate-900 dark:text-white">
            {t("plant.farmPlotModal.title")}
          </Text>

          <View className="mb-2.5 flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
            <TextInput
              className="ml-2 flex-1 text-sm text-slate-900 dark:text-white"
              placeholder={t("plant.farmPlotModal.searchPlaceholder")}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {isLoading ? (
            <View className="flex-row items-center gap-2 py-4 justify-center">
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
              data={filteredOptions}
              keyExtractor={(item) => item.id}
              className="max-h-[380px]"
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.id === selectedFarmPlotId;

                return (
                  <TouchableOpacity
                    className={`py-2.5 border-b border-slate-400/20 ${isSelected ? "bg-emerald-50 dark:bg-emerald-900/25" : ""}`}
                    onPress={() => onSelect(item.id)}
                  >
                    <Text
                      className={`text-sm ${isSelected ? "text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-900 dark:text-white"}`}
                    >
                      {item.label}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.id}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text className="text-slate-500 dark:text-slate-400 text-[13px] text-center mt-4 mb-3">
                  {t("plant.farmPlotModal.noData")}
                </Text>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
