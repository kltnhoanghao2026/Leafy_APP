import { Pressable, StyleSheet, Text, View } from "react-native";

import type { LatestReadingItemResponse, SensorCode } from "../types";
import { DEFAULT_SENSOR_CODES } from "../utils/chartFormat";
import { getSensorLabel } from "../utils/sensorLabels";

type SensorSelectorProps = {
  value: SensorCode;
  readings?: LatestReadingItemResponse[];
  onChange: (sensorCode: SensorCode) => void;
};

export function SensorSelector({ value, readings, onChange }: SensorSelectorProps) {
  const sensorCodes = Array.from(
    new Set([
      ...(readings?.map((reading) => reading.sensorCode).filter(Boolean) ?? []),
      ...DEFAULT_SENSOR_CODES,
    ]),
  );

  return (
    <View style={styles.wrap}>
      {sensorCodes.map((sensorCode) => (
        <Pressable
          key={sensorCode}
          onPress={() => onChange(sensorCode)}
          style={[styles.chip, value === sensorCode && styles.chipActive]}
        >
          <Text style={[styles.label, value === sensorCode && styles.labelActive]}>
            {getSensorLabel(sensorCode)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  label: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
  },
  labelActive: {
    color: "#166534",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
