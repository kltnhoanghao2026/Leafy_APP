import { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
  Dimensions,
} from "react-native";
import {
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import {
  EVENT_TYPE_VALUES,
  type EventCategory,
  type EventType,
} from "./plant-event.types";
import { EVENT_TYPE_LABELS } from "./plant-event.types";

type FarmPlot = { id: string; name: string };
type FarmZone = { id: string; zoneName: string; farmPlotId?: string };
type Plant = { id: string; nickName?: string | null; plantNumber: string };

export type FilterState = {
  farmPlotId: string;
  farmZoneId: string;
  plantId: string;
  targetType: string;
  eventType: string;
  selectedApplyId: string;
};

type PlantEventHubFilterSheetProps = {
  visible: boolean;
  filter: FilterState;
  onApply: (filter: FilterState) => void;
  onClose: () => void;
  targetProps: {
    targetType: string;
    setTargetType: (type: "FARM_PLOT" | "FARM_ZONE" | "PLANT") => void;
    selectedId: string;
    selectedName: string;
    selectedApplyId: string;
    setSelectedApplyId: (id: string) => void;
    applies: any[];
    farmPlots: FarmPlot[];
    plants: Plant[];
    farmZonesData: FarmZone[];
    farmZonesLoading: boolean;
    selectedPlotIdForZones: string;
    setSelectedPlotIdForZones: (id: string) => void;
    primaryColor: string;
    onSelectTarget: (id: string, name: string, type: "FARM_PLOT" | "FARM_ZONE" | "PLANT") => void;
  };
};

const SCOPE_OPTIONS = [
  { value: "", label: "Tất cả phạm vi" },
  { value: "FARM", label: "Vườn" },
  { value: "FARM_ZONE", label: "Khu vực" },
  { value: "PLANT", label: "Cây" },
] as const;

export function PlantEventHubFilterSheet({
  visible,
  filter,
  onApply,
  onClose,
  targetProps,
}: PlantEventHubFilterSheetProps) {
  const { t } = useTranslation();
  const viewportHeight = Dimensions.get("window").height;

  // Defensive check for props
  const safeFilter = filter ?? {
    farmPlotId: "",
    farmZoneId: "",
    plantId: "",
    targetType: "",
    eventType: "",
    selectedApplyId: "",
  };
  const safeTargetProps = targetProps ?? {
    targetType: "FARM_PLOT" as const,
    setTargetType: () => {},
    selectedId: "",
    selectedName: "",
    selectedApplyId: "",
    setSelectedApplyId: () => {},
    farmPlots: [],
    farmZonesData: [],
    farmZonesLoading: false,
    plants: [],
    primaryColor: "#2F7F34",
  };

  const [local, setLocal] = useState<FilterState>(() => ({
    farmPlotId: safeFilter.farmPlotId,
    farmZoneId: safeFilter.farmZoneId,
    plantId: safeFilter.plantId,
    targetType: safeFilter.targetType,
    eventType: safeFilter.eventType,
    selectedApplyId: safeFilter.selectedApplyId,
  }));

  const resetLocalState = useCallback(() => {
    setLocal({
      farmPlotId: safeFilter.farmPlotId,
      farmZoneId: safeFilter.farmZoneId,
      plantId: safeFilter.plantId,
      targetType: safeFilter.targetType,
      eventType: safeFilter.eventType,
      selectedApplyId: safeFilter.selectedApplyId,
    });
  }, [safeFilter]);

  useEffect(() => {
    if (!visible) return;
    resetLocalState();
  }, [visible, resetLocalState]);

  const handleFarmPlotChange = (value: string) => {
    setLocal((prev) => ({ ...prev, farmPlotId: value, farmZoneId: "" }));
  };

  const handleFarmZoneChange = (value: string) => {
    setLocal((prev) => ({ ...prev, farmZoneId: value }));
  };

  const handleTargetTypeChange = useCallback((value: string) => {
    setLocal((prev) => ({
      ...prev,
      targetType: value as "" | "FARM" | "FARM_ZONE" | "PLANT",
      farmPlotId: "",
      farmZoneId: "",
      plantId: "",
    }));
  }, []);

  const handleApplyChange = (value: string) => {
    setLocal((prev) => ({ ...prev, selectedApplyId: value }));
  };

  const handleEventTypeChange = (value: string) => {
    setLocal((prev) => ({ ...prev, eventType: value }));
  };

  const handleClear = () => {
    const cleared: FilterState = {
      farmPlotId: "",
      farmZoneId: "",
      plantId: "",
      targetType: "",
      eventType: "",
      selectedApplyId: "",
    };
    setLocal(cleared);
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const isAnythingActive =
    local.farmPlotId ||
    local.farmZoneId ||
    local.plantId ||
    local.targetType ||
    local.eventType ||
    local.selectedApplyId;

  const activeFilterCount = [
    local.farmPlotId,
    local.farmZoneId,
    local.plantId,
    local.targetType,
    local.eventType,
    local.selectedApplyId,
  ].filter(Boolean).length;

  // Filter zones by selected farm plot
  const filteredZones = safeTargetProps.farmZonesData.filter(
    (zone) => !local.farmPlotId || zone.farmPlotId === local.farmPlotId,
  );

  const renderSelectButton = (
    label: string,
    selectedValue: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void,
    placeholder?: string,
  ) => {
    const selectedOption = options.find((o) => o.value === selectedValue);
    const displayText = selectedOption?.label || placeholder || label;

    return (
      <View className="mb-3">
        <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </Text>
        <TouchableOpacity
          className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
          onPress={() => {
            // Cycle through options
            const currentIndex = options.findIndex((o) => o.value === selectedValue);
            const nextIndex = (currentIndex + 1) % options.length;
            onChange(options[nextIndex].value);
          }}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm ${selectedValue ? "font-medium text-slate-800 dark:text-slate-100" : "text-slate-400"}`}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          <ChevronDown size={16} color="#64748b" />
        </TouchableOpacity>

        {/* Options dropdown */}
        {options.length > 0 && (
          <View className="mt-1 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                className={`px-3 py-2.5 ${index < options.length - 1 ? "border-b border-slate-100 dark:border-slate-700" : ""}`}
                onPress={() => {
                  onChange(option.value);
                }}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm ${selectedValue === option.value ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

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
            style={{ height: viewportHeight * 0.7, maxHeight: viewportHeight * 0.85 }}
          >
            <View className="items-center mb-1.5">
              <View className="w-12 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {t("calendar.filter.title", "Bộ lọc")}
                </Text>
                {activeFilterCount > 0 && (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
                    <Text className="text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center gap-3">
                {isAnythingActive && (
                  <TouchableOpacity
                    onPress={handleClear}
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-semibold text-red-500">
                      {t("calendar.filter.clearAll", "Xóa bộ lọc")}
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
              {/* Plan Apply selector */}
              {safeTargetProps.applies && safeTargetProps.applies.length > 0 && (
                <View className="mb-4">
                  <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("calendar.planApply", "Áp dụng kế hoạch")}
                  </Text>
                  <ScrollView
                    className="max-h-32"
                    showsVerticalScrollIndicator={false}
                  >
                    <TouchableOpacity
                      className="mb-1.5 flex-row items-center justify-between rounded-xl border px-3 py-2.5"
                      style={{
                        borderColor: !local.selectedApplyId
                          ? `${safeTargetProps.primaryColor}99`
                          : "#e2e8f0",
                        backgroundColor: !local.selectedApplyId
                          ? `${safeTargetProps.primaryColor}14`
                          : "#f8fafc",
                      }}
                      onPress={() => handleApplyChange("")}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color: !local.selectedApplyId
                            ? safeTargetProps.primaryColor
                            : "#334155",
                        }}
                      >
                        {t("common.all", "Tất cả")}
                      </Text>
                    </TouchableOpacity>
                    {safeTargetProps.applies.map((apply: any) => (
                      <TouchableOpacity
                        key={apply.id}
                        className="mb-1.5 flex-row items-center justify-between rounded-xl border px-3 py-2.5"
                        style={{
                          borderColor:
                            local.selectedApplyId === apply.id
                              ? `${safeTargetProps.primaryColor}99`
                              : "#e2e8f0",
                          backgroundColor:
                            local.selectedApplyId === apply.id
                              ? `${safeTargetProps.primaryColor}14`
                              : "#f8fafc",
                        }}
                        onPress={() => handleApplyChange(apply.id)}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color:
                              local.selectedApplyId === apply.id
                                ? safeTargetProps.primaryColor
                                : "#334155",
                          }}
                        >
                          {apply.planName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Event Type filter */}
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("calendar.eventType", "Loại sự kiện")}
              </Text>
              <View className="mb-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2"
                >
                  <TouchableOpacity
                    className={`mr-2 flex-row items-center rounded-full px-3 py-1.5 ${
                      !local.eventType
                        ? "bg-emerald-100 border border-emerald-300"
                        : "bg-white border border-slate-200 dark:bg-slate-700 dark:border-slate-600"
                    }`}
                    onPress={() => handleEventTypeChange("")}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        !local.eventType
                          ? "text-emerald-700"
                          : "text-slate-500 dark:text-slate-300"
                      }`}
                    >
                      {t("common.all", "Tất cả")}
                    </Text>
                  </TouchableOpacity>
                  {EVENT_TYPE_VALUES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      className={`mr-2 flex-row items-center rounded-full px-3 py-1.5 ${
                        local.eventType === type
                          ? "bg-emerald-100 border border-emerald-300"
                          : "bg-white border border-slate-200 dark:bg-slate-700 dark:border-slate-600"
                      }`}
                      onPress={() => handleEventTypeChange(type)}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          local.eventType === type
                            ? "text-emerald-700"
                            : "text-slate-500 dark:text-slate-300"
                        }`}
                      >
                        {EVENT_TYPE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Target Type filter */}
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("calendar.scope", "Phạm vi")}
              </Text>
              <View className="mb-4 flex-row rounded-xl bg-slate-50 p-1.5 dark:bg-slate-800">
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center rounded-lg px-2 py-2 ${
                    local.targetType === "" ? "bg-white shadow-sm dark:bg-slate-700" : ""
                  }`}
                  onPress={() => handleTargetTypeChange("")}
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center rounded-lg px-2 py-2 ${
                    local.targetType === "FARM" ? "bg-white shadow-sm dark:bg-slate-700" : ""
                  }`}
                  onPress={() => handleTargetTypeChange("FARM")}
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vườn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center rounded-lg px-2 py-2 ${
                    local.targetType === "FARM_ZONE" ? "bg-white shadow-sm dark:bg-slate-700" : ""
                  }`}
                  onPress={() => handleTargetTypeChange("FARM_ZONE")}
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Khu vực</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center rounded-lg px-2 py-2 ${
                    local.targetType === "PLANT" ? "bg-white shadow-sm dark:bg-slate-700" : ""
                  }`}
                  onPress={() => handleTargetTypeChange("PLANT")}
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cây</Text>
                </TouchableOpacity>
              </View>

              {/* Farm Plot filter - always shown for testing */}
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("calendar.farmPlot", "Vườn")} (Farm scope only)
              </Text>
              <View className="mb-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                <TouchableOpacity
                  className={`mb-2 flex-row items-center justify-between rounded-xl border px-3 py-2.5 ${
                    !local.farmPlotId
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                  onPress={() => handleFarmPlotChange("")}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-sm font-medium ${
                      !local.farmPlotId
                        ? "text-emerald-700"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {t("common.all", "Tất cả vườn")}
                  </Text>
                </TouchableOpacity>
                {safeTargetProps.farmPlots.map((plot) => (
                  <TouchableOpacity
                    key={plot.id}
                    className="mb-1.5 flex-row items-center justify-between rounded-xl border px-3 py-2.5"
                    style={{
                      borderColor:
                        local.farmPlotId === plot.id
                          ? `${safeTargetProps.primaryColor}99`
                          : "#e2e8f0",
                      backgroundColor:
                        local.farmPlotId === plot.id
                          ? `${safeTargetProps.primaryColor}14`
                          : "#ffffff",
                    }}
                    onPress={() => handleFarmPlotChange(plot.id)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1">
                      <Text
                        className="ml-2 text-sm font-medium"
                        numberOfLines={1}
                        style={{
                          color:
                            local.farmPlotId === plot.id
                              ? safeTargetProps.primaryColor
                              : "#334155",
                        }}
                      >
                        {plot.name}
                      </Text>
                    </View>
                    {local.farmPlotId === plot.id && (
                      <View
                        className="h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: safeTargetProps.primaryColor }}
                      >
                        <Text className="text-[10px] font-bold text-white">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {safeTargetProps.farmPlots.length === 0 && (
                  <Text className="py-2 text-center text-sm text-slate-400">
                    {t("calendar.noFarmPlots", "Không có vườn")}
                  </Text>
                )}
              </View>

              {/* Farm Zone filter - always shown for testing */}
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("calendar.farmZone", "Khu vực")} (Farm Zone scope only)
              </Text>
              <View className="mb-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                <TouchableOpacity
                  className={`mb-2 flex-row items-center justify-between rounded-xl border px-3 py-2.5 ${
                    !local.farmZoneId
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                  onPress={() => handleFarmZoneChange("")}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-sm font-medium ${
                      !local.farmZoneId
                        ? "text-emerald-700"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {t("common.all", "Tất cả khu vực")}
                  </Text>
                </TouchableOpacity>
                {safeTargetProps.farmZonesLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={safeTargetProps.primaryColor}
                  />
                ) : (
                  filteredZones.map((zone) => (
                    <TouchableOpacity
                      key={zone.id}
                      className="mb-1.5 flex-row items-center justify-between rounded-xl border px-3 py-2.5"
                      style={{
                        borderColor:
                          local.farmZoneId === zone.id
                            ? `${safeTargetProps.primaryColor}99`
                            : "#e2e8f0",
                        backgroundColor:
                          local.farmZoneId === zone.id
                            ? `${safeTargetProps.primaryColor}14`
                            : "#ffffff",
                      }}
                      onPress={() => handleFarmZoneChange(zone.id)}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center flex-1">
                        <Text
                          className="ml-2 text-sm font-medium"
                          numberOfLines={1}
                          style={{
                            color:
                              local.farmZoneId === zone.id
                                ? safeTargetProps.primaryColor
                                : "#334155",
                          }}
                        >
                          {zone.zoneName}
                        </Text>
                      </View>
                      {local.farmZoneId === zone.id && (
                        <View
                          className="h-5 w-5 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: safeTargetProps.primaryColor,
                          }}
                        >
                          <Text className="text-[10px] font-bold text-white">
                            ✓
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}
                {!safeTargetProps.farmZonesLoading &&
                  filteredZones.length === 0 && (
                    <Text className="py-2 text-center text-sm text-slate-400">
                      {t("calendar.noFarmZones", "Không có khu vực")}
                    </Text>
                  )}
              </View>

              {/* Plant filter - always shown for testing */}
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("calendar.plant", "Cây")} (Plant scope only)
              </Text>
              <View className="mb-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                <TouchableOpacity
                  className={`mb-2 flex-row items-center justify-between rounded-xl border px-3 py-2.5 ${
                    !local.plantId
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                  onPress={() => setLocal((prev) => ({ ...prev, plantId: "" }))}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-sm font-medium ${
                      !local.plantId
                        ? "text-emerald-700"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {t("common.all", "Tất cả cây")}
                  </Text>
                </TouchableOpacity>
                {safeTargetProps.plants.map((plant) => (
                  <TouchableOpacity
                    key={plant.id}
                    className="mb-1.5 flex-row items-center justify-between rounded-xl border px-3 py-2.5"
                    style={{
                      borderColor:
                        local.plantId === plant.id
                          ? `${safeTargetProps.primaryColor}99`
                          : "#e2e8f0",
                      backgroundColor:
                        local.plantId === plant.id
                          ? `${safeTargetProps.primaryColor}14`
                          : "#ffffff",
                    }}
                    onPress={() =>
                      setLocal((prev) => ({ ...prev, plantId: plant.id }))
                    }
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1">
                      <Text
                        className="ml-2 text-sm font-medium"
                        numberOfLines={1}
                        style={{
                          color:
                            local.plantId === plant.id
                              ? safeTargetProps.primaryColor
                              : "#334155",
                        }}
                      >
                        {plant.nickName || plant.plantNumber}
                      </Text>
                    </View>
                    {local.plantId === plant.id && (
                      <View
                        className="h-5 w-5 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: safeTargetProps.primaryColor,
                        }}
                      >
                        <Text className="text-[10px] font-bold text-white">
                          ✓
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {safeTargetProps.plants.length === 0 && (
                  <Text className="py-2 text-center text-sm text-slate-400">
                    {t("calendar.noPlants", "Không có cây")}
                  </Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              className="mt-2 items-center rounded-2xl bg-emerald-600 py-3 active:bg-emerald-700"
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Text className="text-sm font-bold text-white">
                {t("calendar.filter.apply", "Áp dụng")}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
