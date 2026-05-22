import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import {
  EVENT_TYPE_VALUES,
  type EventType,
} from "./plant-event.types";
import { EVENT_TYPE_LABELS } from "./plant-event.types";
import { SelectRow, SelectOption } from "./subComponents/shared";

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

type FilterBarProps = {
  filter: FilterState;
  onApply: (filter: FilterState) => void;
  data: {
    applies: any[];
    farmPlots: FarmPlot[];
    plants: Plant[];
    farmZonesData: FarmZone[];
    farmZonesLoading: boolean;
    primaryColor: string;
  };
};

type ActiveChip = {
  key: string;
  label: string;
  onClear: () => void;
};

const SCOPE_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "FARM", label: "Vườn" },
  { value: "FARM_ZONE", label: "Khu vực" },
  { value: "PLANT", label: "Cây" },
] as const;

function buildActiveChips(
  filter: FilterState,
  onClear: (key: keyof FilterState, val: string) => void,
): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (filter.targetType) {
    const scopeLabel = SCOPE_OPTIONS.find((s) => s.value === filter.targetType)?.label ?? filter.targetType;
    chips.push({
      key: "targetType",
      label: `📍 ${scopeLabel}`,
      onClear: () => onClear("targetType", ""),
    });
  }
  if (filter.eventType) {
    chips.push({
      key: "eventType",
      label: EVENT_TYPE_LABELS[filter.eventType as EventType] ?? filter.eventType,
      onClear: () => onClear("eventType", ""),
    });
  }
  if (filter.selectedApplyId) {
    chips.push({
      key: "selectedApplyId",
      label: "📋 Kế hoạch",
      onClear: () => onClear("selectedApplyId", ""),
    });
  }
  if (filter.farmPlotId) {
    chips.push({
      key: "farmPlotId",
      label: "🗺️ Vườn",
      onClear: () => onClear("farmPlotId", ""),
    });
  }
  if (filter.farmZoneId) {
    chips.push({
      key: "farmZoneId",
      label: "🗂️ Khu vực",
      onClear: () => onClear("farmZoneId", ""),
    });
  }
  if (filter.plantId) {
    chips.push({
      key: "plantId",
      label: "🌱 Cây",
      onClear: () => onClear("plantId", ""),
    });
  }
  return chips;
}

// ── Select row component ────────────────────────────────────────────────────────

export function PlantEventHubFilterBar({
  filter,
  onApply,
  data,
}: FilterBarProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [local, setLocal] = useState<FilterState>(filter);
  // Track which selects are open (only one at a time)
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  const { applies, farmPlots, plants, farmZonesData, farmZonesLoading, primaryColor } = data;

  useEffect(() => {
    setLocal(filter);
  }, [filter]);

  const totalActive = [
    filter.farmPlotId,
    filter.farmZoneId,
    filter.plantId,
    filter.eventType,
    filter.selectedApplyId,
    filter.targetType,
  ].filter(Boolean).length;

  const chips = buildActiveChips(filter, (key, val) => {
    onApply({ ...filter, [key]: val });
  });

  const setLocalField = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    // Close the dropdown after selection
    setOpenSelect(null);
  };

  // Scope change cascades: clearing sub-filters for the new scope
  const handleScopeChange = (value: string) => {
    setLocal((prev) => ({
      ...prev,
      targetType: value,
      farmPlotId: "",
      farmZoneId: "",
      plantId: "",
    }));
    setOpenSelect(null);
  };

  const applyAndClose = () => {
    onApply(local);
    setExpanded(false);
    setOpenSelect(null);
  };

  const resetToCurrent = () => {
    setLocal(filter);
    setOpenSelect(null);
  };

  const toggleSelect = (key: string) => {
    setOpenSelect((prev) => (prev === key ? null : key));
  };

  const filteredZones = farmZonesData.filter(
    (z) => !local.farmPlotId || z.farmPlotId === local.farmPlotId,
  );

  // Derived labels for select triggers
  const selectedScopeLabel = SCOPE_OPTIONS.find((s) => s.value === local.targetType)?.label ?? "Tất cả";
  const selectedEventTypeLabel = local.eventType
    ? EVENT_TYPE_LABELS[local.eventType as EventType] ?? local.eventType
    : t("common.all", "Tất cả");
  const selectedApplyLabel = local.selectedApplyId
    ? (applies.find((a: any) => a.id === local.selectedApplyId)?.planName ?? local.selectedApplyId)
    : t("common.all", "Tất cả");
  const selectedPlotLabel = local.farmPlotId
    ? (farmPlots.find((p) => p.id === local.farmPlotId)?.name ?? local.farmPlotId)
    : t("common.all", "Tất cả vườn");
  const selectedZoneLabel = local.farmZoneId
    ? (filteredZones.find((z) => z.id === local.farmZoneId)?.zoneName ?? local.farmZoneId)
    : t("common.all", "Tất cả khu vực");
  const selectedPlantLabel = local.plantId
    ? ((plants.find((p) => p.id === local.plantId)?.nickName ??
        plants.find((p) => p.id === local.plantId)?.plantNumber) ??
        local.plantId)
    : t("common.all", "Tất cả cây");

  return (
    <View className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
      {/* ── Collapsed: quick chip strip ────────────────────────────────── */}
      <TouchableOpacity
        className="flex-row items-center justify-between px-3 py-2.5"
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-2 flex-1">
          <SlidersHorizontal
            size={14}
            color={totalActive > 0 ? primaryColor : "#94a3b8"}
          />
          <Text
            className="text-xs font-semibold"
            style={{ color: totalActive > 0 ? primaryColor : "#64748b" }}
          >
            {totalActive > 0
              ? `${totalActive} ${t("calendar.filter.active", { count: totalActive })}`
              : t("calendar.filter.button")}
          </Text>

          {/* Inline chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1 ml-2"
            contentContainerStyle={{ gap: 4, alignItems: "center" }}
          >
            {chips.map((chip) => (
              <Pressable
                key={chip.key}
                onPress={(e) => {
                  e.stopPropagation();
                  chip.onClear();
                }}
                className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
                style={{ backgroundColor: primaryColor + "18" }}
              >
                <Text
                  className="text-[10px] font-semibold"
                  style={{ color: primaryColor }}
                >
                  {chip.label}
                </Text>
                <X size={8} color={primaryColor} />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View className="ml-2 flex-row items-center gap-1">
          {totalActive > 0 && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onApply({
                  farmPlotId: "",
                  farmZoneId: "",
                  plantId: "",
                  targetType: "",
                  eventType: "",
                  selectedApplyId: "",
                });
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
            >
              <Text className="text-[10px] font-semibold text-red-500">
                {t("calendar.filter.clearAll", "Xóa")}
              </Text>
            </TouchableOpacity>
          )}
          {expanded ? (
            <ChevronDown size={13} color="#94a3b8" />
          ) : (
            <ChevronRight size={13} color="#94a3b8" />
          )}
        </View>
      </TouchableOpacity>

      {/* ── Expanded: select rows ────────────────────────────────────── */}
      {expanded && (
        <View className="border-t border-slate-100 dark:border-slate-800 px-3 pt-3 pb-3">

          {/* Scope select */}
          <SelectRow
            label={t("calendar.scope", "Phạm vi")}
            selectedLabel={selectedScopeLabel}
            isOpen={openSelect === "targetType"}
            onToggle={() => toggleSelect("targetType")}
            color={primaryColor}
          >
            {SCOPE_OPTIONS.map((scope) => (
              <SelectOption
                key={scope.value}
                label={scope.label}
                active={local.targetType === scope.value}
                color={primaryColor}
                onPress={() => handleScopeChange(scope.value)}
              />
            ))}
          </SelectRow>

          {/* Event Type select */}
          <SelectRow
            label={t("calendar.eventType", "Loại sự kiện")}
            selectedLabel={selectedEventTypeLabel}
            isOpen={openSelect === "eventType"}
            onToggle={() => toggleSelect("eventType")}
            color={primaryColor}
          >
            <SelectOption
              label={t("common.all", "Tất cả")}
              active={!local.eventType}
              color={primaryColor}
              onPress={() => setLocalField("eventType", "")}
            />
            {EVENT_TYPE_VALUES.map((type) => (
              <SelectOption
                key={type}
                label={EVENT_TYPE_LABELS[type]}
                active={local.eventType === type}
                color={primaryColor}
                onPress={() => setLocalField("eventType", type)}
              />
            ))}
          </SelectRow>

          {/* Plan apply select */}
          {applies && applies.length > 0 && (
            <SelectRow
              label={t("calendar.planApply", "Áp dụng kế hoạch")}
              selectedLabel={selectedApplyLabel}
              isOpen={openSelect === "selectedApplyId"}
              onToggle={() => toggleSelect("selectedApplyId")}
              color={primaryColor}
            >
              <SelectOption
                label={t("common.all", "Tất cả")}
                active={!local.selectedApplyId}
                color={primaryColor}
                onPress={() => setLocalField("selectedApplyId", "")}
              />
              {applies.map((apply: any) => (
                <SelectOption
                  key={apply.id}
                  label={apply.planName}
                  active={local.selectedApplyId === apply.id}
                  color={primaryColor}
                  onPress={() => setLocalField("selectedApplyId", apply.id)}
                />
              ))}
            </SelectRow>
          )}

          {/* Farm plot select */}
          {farmPlots.length > 0 && (
            <SelectRow
              label={t("calendar.farmPlot", "Vườn")}
              selectedLabel={selectedPlotLabel}
              isOpen={openSelect === "farmPlotId"}
              onToggle={() => toggleSelect("farmPlotId")}
              color={primaryColor}
            >
              <SelectOption
                label={t("common.all", "Tất cả vườn")}
                active={!local.farmPlotId}
                color={primaryColor}
                onPress={() => setLocalField("farmPlotId", "")}
              />
              {farmPlots.map((plot) => (
                <SelectOption
                  key={plot.id}
                  label={plot.name}
                  active={local.farmPlotId === plot.id}
                  color={primaryColor}
                  onPress={() => setLocalField("farmPlotId", plot.id)}
                />
              ))}
            </SelectRow>
          )}

          {/* Farm zone select */}
          {!farmZonesLoading ? (
            filteredZones.length > 0 ? (
              <SelectRow
                label={t("calendar.farmZone", "Khu vực")}
                selectedLabel={selectedZoneLabel}
                isOpen={openSelect === "farmZoneId"}
                onToggle={() => toggleSelect("farmZoneId")}
                color={primaryColor}
              >
                <SelectOption
                  label={t("common.all", "Tất cả khu vực")}
                  active={!local.farmZoneId}
                  color={primaryColor}
                  onPress={() => setLocalField("farmZoneId", "")}
                />
                {filteredZones.map((zone) => (
                  <SelectOption
                    key={zone.id}
                    label={zone.zoneName}
                    active={local.farmZoneId === zone.id}
                    color={primaryColor}
                    onPress={() => setLocalField("farmZoneId", zone.id)}
                  />
                ))}
              </SelectRow>
            ) : null
          ) : (
            <View className="mb-3">
              <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("calendar.farmZone", "Khu vực")}
              </Text>
              <View className="items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
                <ActivityIndicator size="small" color={primaryColor} />
              </View>
            </View>
          )}

          {/* Plant select */}
          {plants.length > 0 && (
            <SelectRow
              label={t("calendar.plant", "Cây")}
              selectedLabel={selectedPlantLabel}
              isOpen={openSelect === "plantId"}
              onToggle={() => toggleSelect("plantId")}
              color={primaryColor}
            >
              <SelectOption
                label={t("common.all", "Tất cả cây")}
                active={!local.plantId}
                color={primaryColor}
                onPress={() => setLocalField("plantId", "")}
              />
              {plants.map((plant) => (
                <SelectOption
                  key={plant.id}
                  label={plant.nickName || plant.plantNumber}
                  active={local.plantId === plant.id}
                  color={primaryColor}
                  onPress={() => setLocalField("plantId", plant.id)}
                />
              ))}
            </SelectRow>
          )}

          {/* Action buttons */}
          <View className="flex-row gap-2 mt-1">
            <TouchableOpacity
              className="flex-1 items-center rounded-xl border border-slate-200 py-2 dark:border-slate-700"
              onPress={resetToCurrent}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t("common.cancel", "Hủy")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center rounded-xl py-2"
              style={{ backgroundColor: primaryColor }}
              onPress={applyAndClose}
              activeOpacity={0.8}
            >
              <Text className="text-xs font-bold text-white">
                {t("calendar.filter.apply", "Áp dụng")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
