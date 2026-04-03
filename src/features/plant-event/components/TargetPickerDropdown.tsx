import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  Sprout,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import type { EventTargetType } from "./plant-event.types";

type FarmPlot = { id: string; name: string };
type FarmZone = { id: string; zoneName: string };
type Plant = { id: string; nickName?: string | null; plantNumber: string };

type TargetPickerDropdownProps = {
  targetType: EventTargetType;
  setTargetType: (type: EventTargetType) => void;
  selectedId: string;
  farmPlots: FarmPlot[];
  plants: Plant[];
  farmZonesData: FarmZone[];
  farmZonesLoading: boolean;
  selectedPlotIdForZones: string;
  setSelectedPlotIdForZones: (id: string) => void;
  onSelectTarget: (id: string, name: string, type: EventTargetType) => void;
  primaryColor: string;
};

export function TargetPickerDropdown({
  targetType,
  setTargetType,
  selectedId,
  farmPlots,
  plants,
  farmZonesData,
  farmZonesLoading,
  selectedPlotIdForZones,
  setSelectedPlotIdForZones,
  onSelectTarget,
  primaryColor,
}: TargetPickerDropdownProps) {
  const { t } = useTranslation();

  const selectedPlotName = useMemo(
    () => farmPlots.find((p) => p.id === selectedPlotIdForZones)?.name,
    [farmPlots, selectedPlotIdForZones],
  );

  const handleChangeTargetType = (type: EventTargetType) => {
    setTargetType(type);
    if (type !== "FARM_ZONE") {
      setSelectedPlotIdForZones("");
    }
  };

  const renderTypeButton = (
    type: EventTargetType,
    label: string,
    Icon: typeof MapPin,
  ) => {
    const isActive = targetType === type;

    return (
      <Pressable
        key={type}
        className="mb-2 flex-row items-center rounded-xl border px-3 py-2.5"
        style={{
          borderColor: isActive ? `${primaryColor}99` : "#cbd5e1",
          backgroundColor: isActive ? `${primaryColor}14` : "#ffffff",
        }}
        onPress={() => handleChangeTargetType(type)}
      >
        <Icon size={16} color={isActive ? primaryColor : "#64748b"} />
        <Text
          className="ml-2 text-sm font-semibold"
          style={{ color: isActive ? primaryColor : "#334155" }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <>
      {/* Target type selector */}
      <View className="mb-3">
        {renderTypeButton("FARM_PLOT", t("calendar.farmPlots"), MapPin)}
        {renderTypeButton("FARM_ZONE", t("calendar.farmZones"), Layers)}
        {renderTypeButton("PLANT", t("calendar.plants"), Sprout)}
      </View>

      {/* Target items */}
      <ScrollView className="max-h-60" showsVerticalScrollIndicator={false}>
        {targetType === "FARM_PLOT" &&
          farmPlots.map((plot) => (
            <TouchableOpacity
              key={plot.id}
              className="mb-1.5 flex-row items-center justify-between rounded-xl border px-3 py-2.5"
              style={{
                borderColor:
                  selectedId === plot.id ? `${primaryColor}99` : "#e2e8f0",
                backgroundColor:
                  selectedId === plot.id ? `${primaryColor}14` : "#f8fafc",
              }}
              onPress={() => onSelectTarget(plot.id, plot.name, "FARM_PLOT")}
            >
              <View className="flex-row items-center flex-1">
                <MapPin
                  size={16}
                  color={selectedId === plot.id ? primaryColor : "#64748b"}
                />
                <Text
                  className="ml-2 text-sm font-medium"
                  style={{
                    color: selectedId === plot.id ? primaryColor : "#334155",
                  }}
                >
                  {plot.name}
                </Text>
              </View>
              <ChevronRight
                size={14}
                color={selectedId === plot.id ? primaryColor : "#94a3b8"}
              />
            </TouchableOpacity>
          ))}

        {targetType === "FARM_ZONE" && (
          <>
            {!selectedPlotIdForZones ? (
              <>
                <Text className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {t("calendar.selectPlotForZone")}
                </Text>
                {farmPlots.map((plot) => (
                  <TouchableOpacity
                    key={plot.id}
                    className="mb-1.5 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                    onPress={() => setSelectedPlotIdForZones(plot.id)}
                  >
                    <View className="flex-row items-center flex-1">
                      <MapPin size={16} color="#64748b" />
                      <Text className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {plot.name}
                      </Text>
                    </View>
                    <ChevronRight size={14} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
                {farmPlots.length === 0 && (
                  <Text className="py-4 text-center text-sm text-slate-400">
                    {t("calendar.noFarmPlots")}
                  </Text>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity
                  className="mb-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  onPress={() => setSelectedPlotIdForZones("")}
                >
                  <View className="flex-row items-center">
                    <ChevronLeft size={14} color={primaryColor} />
                    <Text
                      className="ml-1 text-xs font-semibold"
                      style={{ color: primaryColor }}
                    >
                      {t("calendar.backToPlots")}
                    </Text>
                  </View>
                  {!!selectedPlotName && (
                    <Text className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedPlotName}
                    </Text>
                  )}
                </TouchableOpacity>
                {farmZonesLoading ? (
                  <ActivityIndicator
                    size="small"
                    className="py-4"
                    color={primaryColor}
                  />
                ) : farmZonesData.length === 0 ? (
                  <Text className="py-4 text-center text-sm text-slate-400">
                    {t("calendar.noFarmZones")}
                  </Text>
                ) : (
                  farmZonesData.map((zone) => (
                    <TouchableOpacity
                      key={zone.id}
                      className="mb-1.5 flex-row items-center justify-between rounded-xl border px-3 py-2.5"
                      style={{
                        borderColor:
                          selectedId === zone.id
                            ? `${primaryColor}99`
                            : "#e2e8f0",
                        backgroundColor:
                          selectedId === zone.id
                            ? `${primaryColor}14`
                            : "#f8fafc",
                      }}
                      onPress={() => {
                        onSelectTarget(zone.id, zone.zoneName, "FARM_ZONE");
                        setSelectedPlotIdForZones("");
                      }}
                    >
                      <View className="flex-row items-center flex-1">
                        <Layers
                          size={16}
                          color={
                            selectedId === zone.id ? primaryColor : "#64748b"
                          }
                        />
                        <Text
                          className="ml-2 text-sm font-medium"
                          style={{
                            color:
                              selectedId === zone.id ? primaryColor : "#334155",
                          }}
                        >
                          {zone.zoneName}
                        </Text>
                      </View>
                      <ChevronRight
                        size={14}
                        color={
                          selectedId === zone.id ? primaryColor : "#94a3b8"
                        }
                      />
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </>
        )}

        {targetType === "PLANT" &&
          plants.map((plant) => (
            <TouchableOpacity
              key={plant.id}
              className="mb-1.5 flex-row items-center justify-between rounded-xl border px-3 py-2.5"
              style={{
                borderColor:
                  selectedId === plant.id ? `${primaryColor}99` : "#e2e8f0",
                backgroundColor:
                  selectedId === plant.id ? `${primaryColor}14` : "#f8fafc",
              }}
              onPress={() =>
                onSelectTarget(
                  plant.id,
                  plant.nickName ?? plant.plantNumber,
                  "PLANT",
                )
              }
            >
              <View className="flex-row items-center flex-1">
                <Sprout
                  size={16}
                  color={selectedId === plant.id ? primaryColor : "#64748b"}
                />
                <Text
                  className="ml-2 text-sm font-medium"
                  style={{
                    color: selectedId === plant.id ? primaryColor : "#334155",
                  }}
                >
                  {plant.nickName ?? plant.plantNumber}
                </Text>
              </View>
              <ChevronRight
                size={14}
                color={selectedId === plant.id ? primaryColor : "#94a3b8"}
              />
            </TouchableOpacity>
          ))}

        {targetType === "FARM_PLOT" && farmPlots.length === 0 && (
          <Text className="py-4 text-center text-sm text-slate-400">
            {t("calendar.noFarmPlots")}
          </Text>
        )}
        {targetType === "PLANT" && plants.length === 0 && (
          <Text className="py-4 text-center text-sm text-slate-400">
            {t("calendar.noPlants")}
          </Text>
        )}
      </ScrollView>
    </>
  );
}
