import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PickerModal } from "@/src/components/ui/PickerModal";
import { useIotTheme } from "./IoTUi";
import type { LatestReadingItemResponse, SensorCode } from "../types";
import { DEFAULT_SENSOR_CODES } from "../utils/chartFormat";
import { getSensorLabel } from "../utils/sensorLabels";

type SensorSelectorProps = {
  value: SensorCode;
  readings?: LatestReadingItemResponse[];
  onChange: (sensorCode: SensorCode) => void;
};

export function SensorSelector({
  value,
  readings,
  onChange,
}: SensorSelectorProps) {
  const { t } = useTranslation();
  const theme = useIotTheme();
  const [open, setOpen] = useState(false);
  const sensorCodes = Array.from(
    new Set([
      ...(readings?.map((reading) => reading.sensorCode).filter(Boolean) ?? []),
      ...DEFAULT_SENSOR_CODES,
    ]),
  );
  const selectedLabel = getSensorLabel(value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.dropdown,
          { backgroundColor: theme.card, borderColor: theme.border },
          pressed && styles.dropdownPressed,
        ]}
      >
        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={[styles.dropdownLabel, { color: theme.text }]}>
            {selectedLabel}
          </Text>
          <Text style={[styles.dropdownMeta, { color: theme.subtle }]}>{value}</Text>
        </View>
        <View style={[styles.dropdownIcon, { backgroundColor: theme.primarySoft }]}>
          <ChevronDown color={theme.primary} size={20} />
        </View>
      </Pressable>

      <PickerModal
        visible={open}
        title={t("iot.charts.metricLabel")}
        items={sensorCodes}
        selectedId={value}
        searchPlaceholder={t("iot.charts.searchMetric")}
        keyExtractor={(sensorCode) => sensorCode}
        labelExtractor={(sensorCode) => getSensorLabel(sensorCode)}
        subtitleExtractor={(sensorCode) => sensorCode}
        onClose={() => setOpen(false)}
        onSelect={(sensorCode) => {
          onChange(sensorCode as SensorCode);
          setOpen(false);
        }}
        renderItem={(sensorCode, selected) => (
          <Pressable
            onPress={() => {
              onChange(sensorCode as SensorCode);
              setOpen(false);
            }}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <View style={styles.textWrap}>
              <Text
                style={[
                  styles.optionLabel,
                  { color: selected ? theme.primary : theme.text },
                  selected && styles.optionLabelSelected,
                ]}
              >
                {getSensorLabel(sensorCode)}
              </Text>
              <Text style={[styles.optionMeta, { color: theme.subtle }]}>{sensorCode}</Text>
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
    paddingVertical: 11,
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
    marginTop: 2,
  },
  dropdownPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
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
  optionMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },
  optionSelected: {
    backgroundColor: "#f0fdf4",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
});
