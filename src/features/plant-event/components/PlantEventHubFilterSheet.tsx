import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import {
  EVENT_CATEGORY_MAP,
  EVENT_TYPE_VALUES,
  getEventCategoryColors,
  getEventTypeIcon,
  type EventCategory,
  type EventTargetType,
  type EventType,
} from "./plant-event.types";
import { CATEGORY_DOT_COLORS } from "./calendarConstants";
import { TargetPickerDropdown } from "./TargetPickerDropdown";

const FILTER_CATEGORY_ORDER: EventCategory[] = [
  "ROUTINE_CARE",
  "HEALTH_MEDICAL",
  "GROWTH_LIFECYCLE",
];

const GROUPED_EVENT_TYPES: { category: EventCategory; types: EventType[] }[] =
  FILTER_CATEGORY_ORDER.map((category) => ({
    category,
    types: EVENT_TYPE_VALUES.filter(
      (type) => EVENT_CATEGORY_MAP[type] === category,
    ),
  }));

export type FilterState = {
  categories: Set<EventCategory>;
  types: Set<EventType>;
};

type FarmPlot = { id: string; name: string };
type FarmZone = { id: string; zoneName: string };
type Plant = { id: string; nickName?: string | null; plantNumber: string };

export type TargetProps = {
  targetType: EventTargetType;
  setTargetType: (targetType: EventTargetType) => void;
  selectedId: string;
  selectedName: string;
  farmPlots: FarmPlot[];
  plants: Plant[];
  farmZonesData: FarmZone[];
  farmZonesLoading: boolean;
  selectedPlotIdForZones: string;
  setSelectedPlotIdForZones: (id: string) => void;
  onSelectTarget: (id: string, name: string, type: EventTargetType) => void;
  primaryColor: string;
};

type PlantEventHubFilterSheetProps = {
  visible: boolean;
  filter: FilterState;
  onApply: (filter: FilterState) => void;
  onClose: () => void;
  targetProps: TargetProps;
};

export function PlantEventHubFilterSheet({
  visible,
  filter,
  onApply,
  onClose,
  targetProps,
}: PlantEventHubFilterSheetProps) {
  const { t } = useTranslation();
  const { height: viewportHeight } = useWindowDimensions();
  const [local, setLocal] = useState<FilterState>(() => ({
    categories: new Set(filter.categories),
    types: new Set(filter.types),
  }));

  useEffect(() => {
    if (!visible) return;
    setLocal({
      categories: new Set(filter.categories),
      types: new Set(filter.types),
    });
  }, [filter.categories, filter.types, visible]);

  const toggleCategory = (category: EventCategory) => {
    setLocal((previous) => {
      const categories = new Set(previous.categories);
      const types = new Set(previous.types);

      if (categories.has(category)) {
        categories.delete(category);
        GROUPED_EVENT_TYPES.find(
          (group) => group.category === category,
        )?.types.forEach((eventType) => types.delete(eventType));
      } else {
        categories.add(category);
        GROUPED_EVENT_TYPES.find(
          (group) => group.category === category,
        )?.types.forEach((eventType) => types.delete(eventType));
      }

      return { categories, types };
    });
  };

  const toggleType = (type: EventType, category: EventCategory) => {
    setLocal((previous) => {
      const categories = new Set(previous.categories);
      const types = new Set(previous.types);

      if (categories.has(category)) {
        categories.delete(category);
        GROUPED_EVENT_TYPES.find(
          (group) => group.category === category,
        )?.types.forEach((eventType) => {
          if (eventType !== type) types.add(eventType);
        });
      } else if (types.has(type)) {
        types.delete(type);
      } else {
        types.add(type);
        const siblings =
          GROUPED_EVENT_TYPES.find((group) => group.category === category)
            ?.types ?? [];
        if (siblings.every((eventType) => types.has(eventType))) {
          siblings.forEach((eventType) => types.delete(eventType));
          categories.add(category);
        }
      }

      return { categories, types };
    });
  };

  const isTypeVisible = (type: EventType, category: EventCategory) =>
    local.categories.has(category) || local.types.has(type);

  const clearAll = () => setLocal({ categories: new Set(), types: new Set() });

  const isAnythingActive = local.categories.size > 0 || local.types.size > 0;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable onPress={(event) => event.stopPropagation()}>
          <View
            className="rounded-t-3xl bg-white dark:bg-slate-900 px-4 pt-2 pb-5"
            style={{ height: viewportHeight }}
          >
            <View className="items-center mb-1.5">
              <View className="w-12 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                {t("calendar.filter.title")}
              </Text>
              <View className="flex-row items-center gap-3">
                {isAnythingActive && (
                  <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
                    <Text className="text-xs font-semibold text-red-500">
                      {t("calendar.filter.clearAll")}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={onClose}
                  className="rounded-full bg-slate-100 p-1.5 dark:bg-slate-800"
                  activeOpacity={0.7}
                >
                  <X size={16} className="text-slate-500 dark:text-slate-400" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("calendar.filter.targetSection")}
              </Text>
              <View className="mb-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                <TargetPickerDropdown
                  targetType={targetProps.targetType}
                  setTargetType={targetProps.setTargetType}
                  selectedId={targetProps.selectedId}
                  farmPlots={targetProps.farmPlots}
                  plants={targetProps.plants}
                  farmZonesData={targetProps.farmZonesData}
                  farmZonesLoading={targetProps.farmZonesLoading}
                  selectedPlotIdForZones={targetProps.selectedPlotIdForZones}
                  setSelectedPlotIdForZones={
                    targetProps.setSelectedPlotIdForZones
                  }
                  onSelectTarget={(id, name, type) => {
                    targetProps.onSelectTarget(id, name, type);
                  }}
                  primaryColor={targetProps.primaryColor}
                />
              </View>

              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("calendar.filter.typeSection")}
              </Text>

              {GROUPED_EVENT_TYPES.map(({ category, types }) => {
                const catColors = {
                  ROUTINE_CARE: {
                    activeBg: "#EFF6FF",
                    activeBorder: "#93C5FD",
                    activeText: "#2563EB",
                    dot: CATEGORY_DOT_COLORS.ROUTINE_CARE,
                  },
                  HEALTH_MEDICAL: {
                    activeBg: "#FFF7ED",
                    activeBorder: "#FDBA74",
                    activeText: "#EA580C",
                    dot: CATEGORY_DOT_COLORS.HEALTH_MEDICAL,
                  },
                  GROWTH_LIFECYCLE: {
                    activeBg: "#ECFDF5",
                    activeBorder: "#6EE7B7",
                    activeText: "#059669",
                    dot: CATEGORY_DOT_COLORS.GROWTH_LIFECYCLE,
                  },
                }[category];

                const categoryActive = local.categories.has(category);

                return (
                  <View key={category} className="mb-4">
                    <TouchableOpacity
                      className="flex-row items-center gap-2 rounded-xl px-3 py-2.5 mb-2"
                      style={{
                        backgroundColor: categoryActive
                          ? catColors.activeBg
                          : "#F8FAFC",
                        borderWidth: 1.5,
                        borderColor: categoryActive
                          ? catColors.activeBorder
                          : "#E2E8F0",
                      }}
                      onPress={() => toggleCategory(category)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: catColors.dot,
                        }}
                      />

                      <Text
                        className="flex-1 text-sm font-bold"
                        style={{
                          color: categoryActive
                            ? catColors.activeText
                            : "#475569",
                        }}
                      >
                        {t(`plantEvent.eventCategory.${category}`)}
                      </Text>

                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: categoryActive
                            ? catColors.activeBorder
                            : "#E2E8F0",
                        }}
                      >
                        {categoryActive && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: catColors.activeText,
                            }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>

                    <View className="flex-row flex-wrap gap-2 pl-2">
                      {types.map((type) => {
                        const Icon = getEventTypeIcon(type);
                        const colors = getEventCategoryColors(type);
                        const typeActive = isTypeVisible(type, category);

                        return (
                          <TouchableOpacity
                            key={type}
                            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
                              typeActive
                                ? `${colors.bg} ${colors.darkBg}`
                                : "bg-slate-100 dark:bg-slate-800"
                            }`}
                            style={{
                              borderWidth: 1,
                              borderColor: typeActive
                                ? catColors.activeBorder
                                : "transparent",
                            }}
                            onPress={() => toggleType(type, category)}
                            activeOpacity={0.7}
                          >
                            <Icon
                              size={12}
                              className={
                                typeActive
                                  ? `${colors.text} ${colors.darkText}`
                                  : "text-slate-400 dark:text-slate-500"
                              }
                            />
                            <Text
                              className={`text-[11px] font-semibold ${
                                typeActive
                                  ? `${colors.text} ${colors.darkText}`
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {t(`plantEvent.eventType.${type}`)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              className="mt-2 items-center rounded-2xl bg-green-700 py-3 active:bg-green-800"
              onPress={() => {
                onApply(local);
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Text className="text-sm font-bold text-white">
                {t("calendar.filter.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
