import { StyleSheet, Text, View } from "react-native";

import type { DashboardOverviewResponse } from "../types";
import { MetricSummaryCard } from "./MetricSummaryCard";

type DashboardOverviewCardProps = {
  overview?: DashboardOverviewResponse;
};

export function DashboardOverviewCard({ overview }: DashboardOverviewCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tổng quan vườn</Text>
      <View style={styles.grid}>
        <MetricSummaryCard label="Tổng thiết bị" value={overview?.totalDevices ?? 0} />
        <MetricSummaryCard
          label="Online"
          tone="green"
          value={overview?.onlineDevices ?? 0}
        />
        <MetricSummaryCard
          label="Offline"
          tone="amber"
          value={overview?.offlineDevices ?? 0}
        />
        <MetricSummaryCard label="Khu vực" tone="blue" value={overview?.totalZones ?? 0} />
        <MetricSummaryCard
          label="Cảnh báo mở"
          tone="red"
          value={overview?.openAlerts ?? 0}
        />
      </View>
    </View>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  title: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
});
