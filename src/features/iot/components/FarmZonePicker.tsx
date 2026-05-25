import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PickerModal } from "@/src/components/ui/PickerModal";
import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";
import { useFarmPlots, useFarmZones } from "@/src/features/farm";
import type { FarmPlotResponse, FarmZoneResponse } from "@/src/features/farm";

export type FarmZoneSelection = {
  farmPlotId?: string;
  farmPlotName?: string;
  zoneId?: string;
  zoneName?: string;
};

type FarmZonePickerProps = {
  value: FarmZoneSelection;
  onChange: (value: FarmZoneSelection) => void;
  title?: string;
};

type ActivePicker = "farm" | "zone" | null;

export function FarmZonePicker({ value, onChange, title }: FarmZonePickerProps) {
  const { t } = useTranslation();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const profileQuery = useQuery(getMyProfileQueryOptions());
  const plotsQuery = useFarmPlots(profileQuery.data?.id);
  const zonesQuery = useFarmZones(value.farmPlotId);
  const plots = plotsQuery.data ?? [];
  const zones = zonesQuery.data ?? [];
  const selectedPlot = useMemo(
    () => plots.find((plot) => plot.id === value.farmPlotId),
    [plots, value.farmPlotId],
  );
  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === value.zoneId),
    [value.zoneId, zones],
  );

  const selectPlot = (plot: FarmPlotResponse) => {
    onChange({
      farmPlotId: plot.id,
      farmPlotName: plot.name,
      zoneId: undefined,
      zoneName: undefined,
    });
  };

  const selectZone = (zone: FarmZoneResponse) => {
    onChange({
      ...value,
      zoneId: zone.id,
      zoneName: zone.zoneName,
    });
  };

  const clearPlot = () => {
    onChange({
      farmPlotId: undefined,
      farmPlotName: undefined,
      zoneId: undefined,
      zoneName: undefined,
    });
  };

  const clearZone = () => {
    onChange({
      ...value,
      zoneId: undefined,
      zoneName: undefined,
    });
  };

  const selectedFarmLabel =
    selectedPlot?.name ?? value.farmPlotName ?? t("iot.devices.onboarding.selectFarm");
  const selectedFarmMeta =
    selectedPlot?.addressLine || selectedPlot?.code || t("iot.common.noFarmMetadata");
  const selectedZoneLabel =
    selectedZone?.zoneName ?? value.zoneName ?? t("iot.devices.onboarding.selectZone");
  const selectedZoneMeta =
    selectedZone?.cropType || selectedZone?.soilType || selectedZone?.zoneCode || t("iot.common.noZoneMetadata");

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title ?? t("iot.devices.onboarding.locationTitle")}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>{t("iot.devices.onboarding.selectFarm")}</Text>
        {profileQuery.isLoading || plotsQuery.isLoading ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.loadingFarms")}</Text>
        ) : null}
        {profileQuery.isError || plotsQuery.isError ? (
          <Text style={styles.error}>{t("iot.devices.onboarding.farmsLoadFailed")}</Text>
        ) : null}
        {!plotsQuery.isLoading && !plotsQuery.data?.length ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.noFarms")}</Text>
        ) : null}
        <DropdownField
          disabled={profileQuery.isLoading || plotsQuery.isLoading || !plots.length}
          hasValue={Boolean(value.farmPlotId)}
          label={selectedFarmLabel}
          meta={value.farmPlotId ? selectedFarmMeta : t("iot.common.searchFarm")}
          onClear={clearPlot}
          onPress={() => setActivePicker("farm")}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("iot.devices.onboarding.selectZone")}</Text>
        {!value.farmPlotId ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.selectFarmFirst")}</Text>
        ) : null}
        {value.farmPlotId && zonesQuery.isLoading ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.loadingZones")}</Text>
        ) : null}
        {value.farmPlotId && zonesQuery.isError ? (
          <Text style={styles.error}>{t("iot.devices.onboarding.zonesLoadFailed")}</Text>
        ) : null}
        {value.farmPlotId && !zonesQuery.isLoading && !zonesQuery.data?.length ? (
          <Text style={styles.hint}>{t("iot.devices.onboarding.noZones")}</Text>
        ) : null}
        <DropdownField
          disabled={!value.farmPlotId || zonesQuery.isLoading || !zones.length}
          hasValue={Boolean(value.zoneId)}
          label={selectedZoneLabel}
          meta={value.zoneId ? selectedZoneMeta : t("iot.common.searchZone")}
          onClear={clearZone}
          onPress={() => setActivePicker("zone")}
        />
      </View>

      <PickerModal
        visible={activePicker === "farm"}
        title={t("iot.devices.onboarding.selectFarm")}
        items={plots}
        selectedId={value.farmPlotId}
        isLoading={profileQuery.isLoading || plotsQuery.isLoading}
        searchPlaceholder={t("iot.common.searchFarm")}
        emptyText={t("iot.common.noFarmsFound")}
        keyExtractor={(plot) => plot.id}
        labelExtractor={(plot) => plot.name || plot.code || t("iot.common.unknownFarm")}
        subtitleExtractor={(plot) => plot.addressLine || plot.code || t("iot.common.noFarmMetadata")}
        searchFields={[
          (plot) => plot.name,
          (plot) => plot.code,
          (plot) => plot.addressLine,
        ]}
        onClose={() => setActivePicker(null)}
        onSelect={(plotId) => {
          const plot = plots.find((item) => item.id === plotId);
          if (plot) selectPlot(plot);
          setActivePicker(null);
        }}
        renderItem={(plot, isSelected) => (
          <PickerOption
            label={plot.name || plot.code || t("iot.common.unknownFarm")}
            meta={plot.addressLine || plot.code || t("iot.common.noFarmMetadata")}
            selected={isSelected}
            onPress={() => {
              selectPlot(plot);
              setActivePicker(null);
            }}
          />
        )}
      />

      <PickerModal
        visible={activePicker === "zone"}
        title={t("iot.devices.onboarding.selectZone")}
        items={zones}
        selectedId={value.zoneId}
        isLoading={zonesQuery.isLoading}
        searchPlaceholder={t("iot.common.searchZone")}
        emptyText={t("iot.common.noZonesFound")}
        keyExtractor={(zone) => zone.id}
        labelExtractor={(zone) => zone.zoneName || zone.zoneCode || t("iot.common.unknownZone")}
        subtitleExtractor={(zone) =>
          zone.cropType || zone.soilType || zone.zoneCode || t("iot.common.noZoneMetadata")
        }
        searchFields={[
          (zone) => zone.zoneName,
          (zone) => zone.zoneCode,
          (zone) => zone.cropType,
          (zone) => zone.soilType,
        ]}
        onClose={() => setActivePicker(null)}
        onSelect={(zoneId) => {
          const zone = zones.find((item) => item.id === zoneId);
          if (zone) selectZone(zone);
          setActivePicker(null);
        }}
        renderItem={(zone, isSelected) => (
          <PickerOption
            label={zone.zoneName || zone.zoneCode || t("iot.common.unknownZone")}
            meta={zone.cropType || zone.soilType || zone.zoneCode || t("iot.common.noZoneMetadata")}
            selected={isSelected}
            onPress={() => {
              selectZone(zone);
              setActivePicker(null);
            }}
          />
        )}
      />
    </View>
  );
}

function DropdownField({
  label,
  meta,
  hasValue,
  disabled,
  onClear,
  onPress,
}: {
  label: string;
  meta?: string | null;
  hasValue: boolean;
  disabled?: boolean;
  onClear: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.dropdown,
        disabled && styles.dropdownDisabled,
        pressed && !disabled && styles.optionPressed,
      ]}
    >
      <View style={styles.dropdownTextWrap}>
        <Text style={[styles.dropdownLabel, !hasValue && styles.dropdownPlaceholder]}>{label}</Text>
        {meta ? <Text style={styles.dropdownMeta}>{meta}</Text> : null}
      </View>
      {hasValue ? (
        <Pressable
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onClear();
          }}
          style={styles.clearIconButton}
        >
          <X color="#64748b" size={16} />
        </Pressable>
      ) : null}
      <ChevronDown color={disabled ? "#cbd5e1" : "#16a34a"} size={18} />
    </Pressable>
  );
}

function PickerOption({
  label,
  meta,
  selected,
  onPress,
}: {
  label: string;
  meta?: string | null;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pickerOption, selected && styles.pickerOptionSelected]}>
      <View style={styles.dropdownTextWrap}>
        <Text style={[styles.pickerOptionLabel, selected && styles.pickerOptionLabelSelected]}>{label}</Text>
        {meta ? <Text style={styles.pickerOptionMeta}>{meta}</Text> : null}
      </View>
      {selected ? (
        <View style={styles.checkBadge}>
          <Check color="#ffffff" size={14} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  error: {
    color: "#be123c",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  hint: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: "#16a34a",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  clearIconButton: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  dropdown: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#bbf7d0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownDisabled: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  dropdownLabel: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  dropdownMeta: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  dropdownPlaceholder: {
    color: "#64748b",
  },
  dropdownTextWrap: {
    flex: 1,
  },
  optionPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  pickerOption: {
    alignItems: "center",
    borderBottomColor: "rgba(148, 163, 184, 0.18)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  pickerOptionLabel: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  pickerOptionLabelSelected: {
    color: "#166534",
  },
  pickerOptionMeta: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  pickerOptionSelected: {
    backgroundColor: "#f0fdf4",
  },
  section: {
    marginTop: 16,
  },
  title: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
});
