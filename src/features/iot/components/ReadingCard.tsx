import { StyleSheet, Text, View } from "react-native";

import type { LatestReadingItemResponse } from "../types";
import { formatDateTime } from "../utils/deviceLabels";
import { getSensorLabel, getSensorUnit } from "../utils/sensorLabels";

type ReadingCardProps = {
  reading: LatestReadingItemResponse;
};

export function ReadingCard({ reading }: ReadingCardProps) {
  const unit = getSensorUnit(reading.sensorCode, reading.unit);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {getSensorLabel(reading.sensorCode, reading.sensorName)}
      </Text>
      <Text style={styles.value}>
        {Number.isFinite(reading.value) ? reading.value.toFixed(1) : reading.value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.time}>{formatDateTime(reading.readingTime)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    width: "48%",
  },
  label: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  time: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 6,
  },
  unit: {
    color: "#64748b",
    fontSize: 14,
  },
  value: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
});
