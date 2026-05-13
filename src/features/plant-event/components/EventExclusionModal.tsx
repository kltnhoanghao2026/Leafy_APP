import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { X, Search, CheckSquare, Square } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useFarmZonesByPlot } from "../../farm/queries/queries";
import { usePlants, usePlantsByFarmPlot } from "../../plant/queries/queries";
import type { TrackingGranularity } from "./plant-event.types";

type EventExclusionModalProps = {
  visible: boolean;
  onClose: () => void;
  parentId: string; // The selected FarmPlot or FarmZone
  parentTargetType: "FARM_PLOT" | "FARM_ZONE" | "PLANT";
  granularity: TrackingGranularity;
  excludedIds: string[]; // List of currently excluded IDs
  onSaveExclusions: (ids: string[]) => void;
};

export function EventExclusionModal({
  visible,
  onClose,
  parentId,
  parentTargetType,
  granularity,
  excludedIds,
  onSaveExclusions,
}: EventExclusionModalProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [localExcluded, setLocalExcluded] = useState<Set<string>>(
    new Set(excludedIds),
  );

  useEffect(() => {
    if (visible) {
      setLocalExcluded(new Set(excludedIds));
      setSearchQuery("");
    }
  }, [visible, excludedIds]);

  const isZoneExclusion = granularity === "ZONE";

  // Queries
  const { data: zones, isLoading: isLoadingZones } = useFarmZonesByPlot(
    isZoneExclusion && parentTargetType === "FARM_PLOT" ? parentId : "",
  );

  const { data: plantsByPlot, isLoading: isLoadingPlantsPlot } =
    usePlantsByFarmPlot(
      granularity === "PLANT" && parentTargetType === "FARM_PLOT" ? parentId : "",
      { size: 1000 },
    );

  const { data: plantsByZonePage, isLoading: isLoadingPlantsZone } = usePlants(
    { farmZoneId: parentId, size: 1000 },
    granularity === "PLANT" && parentTargetType === "FARM_ZONE",
  );

  const isLoading = isZoneExclusion
    ? isLoadingZones
    : parentTargetType === "FARM_PLOT"
      ? isLoadingPlantsPlot
      : isLoadingPlantsZone;

  let items: Array<{ id: string; label: string }> = [];

  if (isZoneExclusion && zones) {
    items = zones.map((z) => ({ id: z.id, label: z.zoneName }));
  } else if (granularity === "PLANT") {
    const plants =
      parentTargetType === "FARM_PLOT"
        ? plantsByPlot?.content
        : plantsByZonePage?.content;

    if (plants) {
      items = plants.map((p) => ({
        id: p.id,
        label: p.nickName || p.plantNumber || p.id,
      }));
    }
  }

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleItem = (id: string) => {
    setLocalExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSaveExclusions(Array.from(localExcluded));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="h-[80%] rounded-t-3xl bg-white dark:bg-slate-900">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              {isZoneExclusion
                ? t("plantEvent.form.excludeZones", "Exclude Zones")
                : t("plantEvent.form.excludePlants", "Exclude Plants")}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} className="text-slate-500" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="p-4">
            <View className="flex-row items-center rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
              <Search size={20} className="text-slate-400" />
              <TextInput
                className="ml-2 flex-1 text-base text-slate-900 dark:text-white"
                placeholder={t("common.search", "Search...")}
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              contentContainerClassName="px-4 pb-4"
              renderItem={({ item }) => {
                const isExcluded = localExcluded.has(item.id);
                return (
                  <TouchableOpacity
                    className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800"
                    onPress={() => toggleItem(item.id)}
                  >
                    <Text
                      className={`text-base ${
                        isExcluded
                          ? "text-slate-400 line-through dark:text-slate-500"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {item.label}
                    </Text>
                    {isExcluded ? (
                      <CheckSquare size={24} color="#ef4444" />
                    ) : (
                      <Square size={24} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text className="text-center text-slate-500 mt-10">
                  {t("common.noData", "No items found")}
                </Text>
              }
            />
          )}

          {/* Footer */}
          <View className="border-t border-slate-200 p-4 pb-8 dark:border-slate-800">
            <TouchableOpacity
              className="rounded-xl bg-green-600 py-3.5 items-center justify-center"
              onPress={handleSave}
            >
              <Text className="text-base font-bold text-white">
                {t("common.save", "Save Exclusions")} ({localExcluded.size})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
