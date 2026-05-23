import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

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
  [zone.cropType, zone.soilType, zone.area].filter(Boolean).join(" · ") || fallback;

export function ZonePicker({
  label,
  value,
  zones,
  onChange,
  placeholder,
  allowClear = true,
}: ZonePickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const fallbackLabel = t("iot.common.unknownZone");
  const metaFallback = t("iot.common.noZoneMetadata");
  const normalizedQuery = query.trim().toLowerCase();
  const selectedZone = zones.find((zone) => zone.id === value);
  const filteredZones = useMemo(() => {
    if (!normalizedQuery) return zones;

    return zones.filter((zone) =>
      [getZoneLabel(zone, fallbackLabel), getZoneMeta(zone, metaFallback)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [fallbackLabel, metaFallback, normalizedQuery, zones]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label ?? t("iot.common.selectZone")}</Text>
      <TextInput
        autoCapitalize="none"
        onChangeText={setQuery}
        placeholder={placeholder ?? t("iot.common.searchZone")}
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={query}
      />
      {selectedZone ? (
        <View style={styles.selectedRow}>
          <View style={styles.selectedTextWrap}>
            <Text style={styles.selectedLabel}>{getZoneLabel(selectedZone, fallbackLabel)}</Text>
            <Text style={styles.secondaryText}>{getZoneMeta(selectedZone, metaFallback)}</Text>
          </View>
          {allowClear ? (
            <Pressable style={styles.clearButton} onPress={() => onChange(null)}>
              <Text style={styles.clearText}>{t("iot.common.clearSelection")}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.optionList}>
        {filteredZones.length === 0 ? (
          <Text style={styles.emptyText}>{t("iot.common.noZonesFound")}</Text>
        ) : (
          filteredZones.slice(0, 8).map((zone) => {
            const zoneLabel = getZoneLabel(zone, fallbackLabel);
            const selected = zone.id === value;

            return (
              <Pressable
                key={zone.id ?? zoneLabel}
                onPress={() => onChange({ id: zone.id, label: zoneLabel })}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {zoneLabel}
                </Text>
                <Text style={styles.secondaryText}>{getZoneMeta(zone, metaFallback)}</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  clearText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  container: {
    gap: 8,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 14,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  option: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  optionLabel: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900",
  },
  optionLabelSelected: {
    color: "#166534",
  },
  optionList: {
    gap: 8,
  },
  optionSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  secondaryText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  selectedLabel: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },
  selectedRow: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 10,
  },
  selectedTextWrap: {
    flex: 1,
  },
});
