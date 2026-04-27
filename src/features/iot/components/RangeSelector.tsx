import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ChartRange } from "../types";
import { CHART_RANGES } from "../utils/chartFormat";

type RangeSelectorProps = {
  value: ChartRange;
  onChange: (range: ChartRange) => void;
};

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <View style={styles.wrap}>
      {CHART_RANGES.map((range) => (
        <Pressable
          key={range.value}
          onPress={() => onChange(range.value)}
          style={[styles.chip, value === range.value && styles.chipActive]}
        >
          <Text style={[styles.label, value === range.value && styles.labelActive]}>
            {range.label}
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
    backgroundColor: "#e0f2fe",
    borderColor: "#0ea5e9",
  },
  label: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
  },
  labelActive: {
    color: "#0369a1",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
