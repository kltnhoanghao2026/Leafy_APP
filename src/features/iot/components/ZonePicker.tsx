import { Check, ChevronDown, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PickerModal } from "@/src/components/ui/PickerModal";

export type ZonePickerOption = {
  id?: string;
  zoneName?: string | null;
  name?: string | null;
  cropType?: string | null;
  soilType?: string | null;
  area?: number | string | null;
};

type ZonePickerProps = {
  label?: string;
  value?: string | null;
  zones: ZonePickerOption[];
  onChange: (zone: { id?: string; label: string } | null) => void;
  placeholder?: string;
  allowClear?: boolean;
};

const getZoneLabel = (zone: ZonePickerOption, fallback: string) =>
  zone.zoneName ?? zone.name ?? fallback;

const getZoneMeta = (zone: ZonePickerOption, fallback: string) =>
  [zone.cropType, zone.soilType, zone.area].filter(Boolean).join(" · ") ||
  fallback;

export function ZonePicker({
  label,
  value,
  zones,
  onChange,
  placeholder,
  allowClear = true,
}: ZonePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const fallbackLabel = t("iot.common.unknownZone");
  const metaFallback = t("iot.common.noZoneMetadata");
  const selectedZone = zones.find((zone) => zone.id === value);
  const selectedLabel = selectedZone
    ? getZoneLabel(selectedZone, fallbackLabel)
    : (placeholder ?? t("iot.common.searchZone"));
  const selectedMeta = selectedZone
    ? getZoneMeta(selectedZone, metaFallback)
    : undefined;

  const selectZone = (zone: ZonePickerOption) => {
    onChange({ id: zone.id, label: getZoneLabel(zone, fallbackLabel) });
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label ?? t("iot.common.selectZone")}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.dropdown,
          pressed && styles.dropdownPressed,
        ]}
      >
        <View style={styles.textWrap}>
          <Text
            numberOfLines={1}
            style={[
              styles.dropdownLabel,
              !selectedZone && styles.dropdownPlaceholder,
            ]}
          >
            {selectedLabel}
          </Text>
          {selectedMeta ? (
            <Text style={styles.dropdownMeta}>{selectedMeta}</Text>
          ) : null}
        </View>
        {selectedZone && allowClear ? (
          <Pressable
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onChange(null);
            }}
            style={styles.clearIconButton}
          >
            <X color="#166534" size={16} />
          </Pressable>
        ) : null}
        <View style={styles.dropdownIcon}>
          <ChevronDown color="#ffffff" size={20} />
        </View>
      </Pressable>
      <PickerModal
        visible={open}
        title={label ?? t("iot.common.selectZone")}
        items={zones}
        selectedId={value ?? undefined}
        searchPlaceholder={placeholder ?? t("iot.common.searchZone")}
        emptyText={t("iot.common.noZonesFound")}
        keyExtractor={(zone) => zone.id ?? getZoneLabel(zone, fallbackLabel)}
        labelExtractor={(zone) => getZoneLabel(zone, fallbackLabel)}
        subtitleExtractor={(zone) => getZoneMeta(zone, metaFallback)}
        searchFields={[
          (zone) => getZoneLabel(zone, fallbackLabel),
          (zone) => getZoneMeta(zone, metaFallback),
        ]}
        onClose={() => setOpen(false)}
        onSelect={(id) => {
          const zone = zones.find(
            (item) => (item.id ?? getZoneLabel(item, fallbackLabel)) === id,
          );
          if (zone) selectZone(zone);
        }}
        renderItem={(zone, selected) => (
          <Pressable
            onPress={() => selectZone(zone)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <View style={styles.textWrap}>
              <Text
                style={[
                  styles.optionLabel,
                  selected && styles.optionLabelSelected,
                ]}
              >
                {getZoneLabel(zone, fallbackLabel)}
              </Text>
              <Text style={styles.secondaryText}>
                {getZoneMeta(zone, metaFallback)}
              </Text>
            </View>
            {selected ? (
              <View style={styles.checkBadge}>
                <Check color="#ffffff" size={14} />
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  container: {
    gap: 8,
  },
  dropdown: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#14532d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownIcon: {
    alignItems: "center",
    backgroundColor: "#16a34a",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  dropdownLabel: {
    color: "#0f172a",
    flexShrink: 1,
    fontSize: 16,
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
  dropdownPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  option: {
    alignItems: "center",
    borderBottomColor: "rgba(148, 163, 184, 0.18)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  optionLabel: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  optionLabelSelected: {
    color: "#166534",
  },
  optionSelected: {
    backgroundColor: "#f0fdf4",
  },
  secondaryText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
});
