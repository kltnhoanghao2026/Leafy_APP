import { useMemo, useState } from "react";
import {
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

import {
  EVENT_TYPE_VALUES,
  EVENT_CATEGORY_MAP,
  getEventCategoryColors,
  getEventTypeIcon,
  type EventType,
  type EventCategory,
} from "./plant-event.types";

type Props = {
  visible: boolean;
  selectedEventType?: string;
  onClose: () => void;
  onSelect: (eventType: EventType) => void;
};

const CATEGORY_ORDER: EventCategory[] = [
  "ROUTINE_CARE",
  "HEALTH_MEDICAL",
  "GROWTH_LIFECYCLE",
];

const GROUPED_TYPES = CATEGORY_ORDER.map((category) => ({
  category,
  types: EVENT_TYPE_VALUES.filter(
    (type) => EVENT_CATEGORY_MAP[type] === category,
  ),
}));

export function EventTypePickerModal({
  visible,
  selectedEventType,
  onClose,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return GROUPED_TYPES;

    return GROUPED_TYPES.map((group) => ({
      ...group,
      types: group.types.filter((type) =>
        t(`plantEvent.eventType.${type}`)
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    })).filter((group) => group.types.length > 0);
  }, [searchQuery, t]);

  const flatData = useMemo(() => {
    const items: Array<
      | { kind: "header"; category: EventCategory; key: string }
      | { kind: "item"; type: EventType; key: string }
    > = [];

    for (const group of filteredGroups) {
      items.push({
        kind: "header",
        category: group.category,
        key: `header-${group.category}`,
      });
      for (const type of group.types) {
        items.push({ kind: "item", type, key: `item-${type}` });
      }
    }

    return items;
  }, [filteredGroups]);

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
            {t("plantEvent.eventTypeModal.title")}
          </Text>

          <View className="mb-2.5 flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
            <TextInput
              className="ml-2 flex-1 text-sm text-slate-900 dark:text-white"
              placeholder={t("plantEvent.eventTypeModal.searchPlaceholder")}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={flatData}
            keyExtractor={(item) => item.key}
            className="max-h-[380px]"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              if (item.kind === "header") {
                return (
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mt-3 mb-1 px-1">
                    {t(`plantEvent.eventCategory.${item.category}`)}
                  </Text>
                );
              }

              const isSelected = item.type === selectedEventType;
              const colors = getEventCategoryColors(item.type);
              const Icon = getEventTypeIcon(item.type);

              return (
                <TouchableOpacity
                  className={`py-2.5 px-1 border-b border-slate-400/20 flex-row items-center gap-2.5 ${isSelected ? "bg-emerald-50 dark:bg-emerald-900/25" : ""}`}
                  onPress={() => onSelect(item.type)}
                >
                  <View
                    className={`w-7 h-7 rounded-lg items-center justify-center ${colors.bg} ${colors.darkBg}`}
                  >
                    <Icon
                      size={15}
                      className={`${colors.text} ${colors.darkText}`}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text
                    className={`text-sm flex-1 ${isSelected ? "text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-900 dark:text-white"}`}
                  >
                    {t(`plantEvent.eventType.${item.type}`)}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text className="text-slate-500 dark:text-slate-400 text-[13px] text-center mt-4 mb-3">
                {t("plantEvent.eventTypeModal.noData")}
              </Text>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
