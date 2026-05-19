import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { DashboardOverviewResponse } from "../types";
import { MetricSummaryCard } from "./MetricSummaryCard";

type DashboardOverviewCardProps = {
  overview?: DashboardOverviewResponse;
};

export function DashboardOverviewCard({ overview }: DashboardOverviewCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("iot.metrics.dashboard.farmOverview")}</Text>
      <View style={styles.grid}>
        <MetricSummaryCard
          label={t("iot.metrics.dashboard.totalDevices")}
          value={overview?.totalDevices ?? 0}
        />
        <MetricSummaryCard
          label={t("iot.metrics.dashboard.online")}
          tone="green"
          value={overview?.onlineDevices ?? 0}
        />
        <MetricSummaryCard
          label={t("iot.metrics.dashboard.offline")}
          tone="amber"
          value={overview?.offlineDevices ?? 0}
        />
        <MetricSummaryCard
          label={t("iot.metrics.dashboard.zones")}
          tone="blue"
          value={overview?.totalZones ?? 0}
        />
        <MetricSummaryCard
          label={t("iot.metrics.dashboard.openAlerts")}
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
