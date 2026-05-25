import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { ZoneOverviewResponse } from "../types";
import { MetricSummaryCard } from "./MetricSummaryCard";

type ZoneOverviewCardProps = {
  overview?: ZoneOverviewResponse;
};

const getOpenAlerts = (overview?: ZoneOverviewResponse): number => {
  return overview?.openAlertCount ?? overview?.openAlerts ?? overview?.alertSummary?.totalOpen ?? 0;
};

export function ZoneOverviewCard({ overview }: ZoneOverviewCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("iot.metrics.zone.overviewTitle")}</Text>
      <View style={styles.grid}>
        <MetricSummaryCard
          label={t("iot.metrics.zone.devices")}
          value={overview?.deviceCount ?? "-"}
        />
        <MetricSummaryCard
          label={t("iot.metrics.dashboard.online")}
          tone="green"
          value={overview?.onlineDeviceCount ?? "-"}
        />
        <MetricSummaryCard
          label={t("iot.metrics.dashboard.offline")}
          tone="amber"
          value={overview?.offlineDeviceCount ?? "-"}
        />
        <MetricSummaryCard
          label={t("iot.metrics.dashboard.openAlerts")}
          tone="red"
          value={getOpenAlerts(overview)}
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
