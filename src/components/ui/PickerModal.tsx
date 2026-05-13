import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
        style={pickerStyles.backdrop}
        onPress={onClose}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[pickerStyles.container, isDark && pickerStyles.containerDark]}
        >
          <Text style={[pickerStyles.title, isDark && pickerStyles.titleDark]}>
            {title}
          </Text>

          <View style={[pickerStyles.searchRow, isDark && pickerStyles.searchRowDark]}>
            <Search size={16} color={isDark ? "#64748b" : "#94a3b8"} />
            <TextInput
              style={[pickerStyles.searchInput, isDark && pickerStyles.searchInputDark]}
              placeholder={searchPlaceholder ?? t("common.search")}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {isLoading ? (
            <View style={pickerStyles.loadingRow}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={pickerStyles.loadingText}>
                {t("common.loading")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={keyExtractor}
              style={pickerStyles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = keyExtractor(item) === selectedId;

                if (renderItem) {
                  return <>{renderItem(item, isSelected)}</>;
                }

                return (
                  <TouchableOpacity
                    style={[
                      pickerStyles.itemRow,
                      isSelected && (isDark ? pickerStyles.itemSelectedDark : pickerStyles.itemSelected),
                    ]}
                    onPress={() => onSelect(keyExtractor(item))}
                  >
                    <Text
                      style={[
                        pickerStyles.itemLabel,
                        isDark && pickerStyles.itemLabelDark,
                        isSelected && pickerStyles.itemLabelSelected,
                      ]}
                    >
                      {labelExtractor(item)}
                    </Text>
                    {subtitleExtractor?.(item) ? (
                      <Text style={pickerStyles.itemSubtitle}>
                        {subtitleExtractor(item)}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={pickerStyles.emptyText}>
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

const pickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.45)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  container: {
    borderWidth: 1,
    borderRadius: 16,
    maxHeight: "72%",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
  },
  containerDark: {
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#0f172a",
  },
  titleDark: {
    color: "#ffffff",
  },
  searchRow: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchRowDark: {
    borderColor: "#1e293b",
    backgroundColor: "#0f172a",
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
  },
  searchInputDark: {
    color: "#ffffff",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    justifyContent: "center",
  },
  loadingText: {
    color: "#64748b",
    fontSize: 13,
  },
  list: {
    maxHeight: 380,
  },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.2)",
  },
  itemSelected: {
    backgroundColor: "#ecfdf5",
  },
  itemSelectedDark: {
    backgroundColor: "rgba(6,78,59,0.25)",
  },
  itemLabel: {
    fontSize: 14,
    color: "#0f172a",
  },
  itemLabelDark: {
    color: "#ffffff",
  },
  itemLabelSelected: {
    color: "#047857",
    fontWeight: "600",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 12,
  },
});

