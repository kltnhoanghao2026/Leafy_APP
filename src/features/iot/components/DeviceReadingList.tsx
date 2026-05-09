import { StyleSheet, Text, View } from "react-native";

import type { LatestReadingItemResponse } from "../types";
import { ReadingCard } from "./ReadingCard";

type DeviceReadingListProps = {
  readings?: LatestReadingItemResponse[];
};

export function DeviceReadingList({ readings }: DeviceReadingListProps) {
  if (!readings?.length) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>Chưa có dữ liệu cảm biến</Text>
        <Text style={styles.emptyText}>
          Khi thiết bị gửi telemetry, các chỉ số mới nhất sẽ hiển thị tại đây.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {readings.map((reading) => (
        <ReadingCard key={reading.sensorCode} reading={reading} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: 18,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
