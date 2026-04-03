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

type PickerModalProps<T> = {
  visible: boolean;
  title: string;
  items: T[];
  selectedId?: string;
  isLoading?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  keyExtractor: (item: T) => string;
  labelExtractor: (item: T) => string;
  subtitleExtractor?: (item: T) => string | undefined;
  searchFields?: ((item: T) => string | undefined)[];
  onClose: () => void;
  onSelect: (id: string) => void;
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
};

export function PickerModal<T>({
  visible,
  title,
  items,
  selectedId,
  isLoading,
  searchPlaceholder,
  emptyText,
  keyExtractor,
  labelExtractor,
  subtitleExtractor,
  searchFields,
  onClose,
  onSelect,
  renderItem,
}: PickerModalProps<T>) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return items;

    const getters = searchFields ?? [labelExtractor];
    return items.filter((item) =>
      getters.some((getter) =>
        getter(item)?.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [items, searchQuery, searchFields, labelExtractor]);

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
            {title}
          </Text>

          <View className="mb-2.5 flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
            <TextInput
              className="ml-2 flex-1 text-sm text-slate-900 dark:text-white"
              placeholder={searchPlaceholder ?? t("common.search")}
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
              data={filteredItems}
              keyExtractor={keyExtractor}
              className="max-h-[380px]"
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = keyExtractor(item) === selectedId;

                if (renderItem) {
                  return <>{renderItem(item, isSelected)}</>;
                }

                return (
                  <TouchableOpacity
                    className={`py-2.5 border-b border-slate-400/20 ${isSelected ? "bg-emerald-50 dark:bg-emerald-900/25" : ""}`}
                    onPress={() => onSelect(keyExtractor(item))}
                  >
                    <Text
                      className={`text-sm ${isSelected ? "text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-900 dark:text-white"}`}
                    >
                      {labelExtractor(item)}
                    </Text>
                    {subtitleExtractor?.(item) ? (
                      <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {subtitleExtractor(item)}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text className="text-slate-500 dark:text-slate-400 text-[13px] text-center mt-4 mb-3">
                  {emptyText ?? t("common.noData")}
                </Text>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
