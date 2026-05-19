import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { DeviceReadingList } from "../components/DeviceReadingList";
import { RangeSelector } from "../components/RangeSelector";
import { SensorChartCard } from "../components/SensorChartCard";
import { SensorSelector } from "../components/SensorSelector";
import { ZoneOverviewCard } from "../components/ZoneOverviewCard";
import { useZoneOverview } from "../hooks/useIotDashboard";
import { useZoneChart } from "../hooks/useTelemetry";
import type { ChartRange, SensorCode } from "../types";

const getParamValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export function ZoneMetricsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    zoneId?: string | string[];
    zoneName?: string | string[];
  }>();
  const zoneId = getParamValue(params.zoneId);
  const zoneName = getParamValue(params.zoneName);
  const [selectedSensor, setSelectedSensor] = useState<SensorCode>("AIR_TEMP");
  const [selectedRange, setSelectedRange] = useState<ChartRange>("H24");
  const overviewQuery = useZoneOverview(zoneId);
  const readings = overviewQuery.data?.latestReadings ?? [];
  const chartQuery = useZoneChart(zoneId, selectedSensor, selectedRange);

  useEffect(() => {
    const firstSensor = readings[0]?.sensorCode;
    if (firstSensor) {
      setSelectedSensor((current) => (current === "AIR_TEMP" ? firstSensor : current));
    }
  }, [readings]);

  const refresh = () => {
    overviewQuery.refetch();
    chartQuery.refetch();
  };

  if (!zoneId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{t("iot.metrics.zone.missingZoneId")}</Text>
        <Text style={styles.errorText}>{t("iot.metrics.zone.missingZoneIdDescription")}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>{t("iot.common.back")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={refresh}
          refreshing={overviewQuery.isRefetching || chartQuery.isRefetching}
          tintColor="#15803d"
        />
      }
      style={styles.screen}
    >
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#0f172a" size={20} />
        <Text style={styles.backText}>{t("iot.metrics.dashboard.title")}</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.kicker}>{t("iot.metrics.zone.kicker")}</Text>
        <Text style={styles.title}>{t("iot.metrics.zone.title")}</Text>
        <Text style={styles.subtitle}>{zoneName || zoneId}</Text>
      </View>

      {overviewQuery.isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#15803d" />
          <Text style={styles.hint}>{t("iot.metrics.zone.loadingOverview")}</Text>
        </View>
      ) : overviewQuery.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{t("iot.metrics.zone.overviewLoadFailed")}</Text>
        </View>
      ) : (
        <ZoneOverviewCard overview={overviewQuery.data} />
      )}

      <Pressable
        style={styles.alertShortcut}
        onPress={() =>
          router.push({
            pathname: "/iot/alerts",
            params: { status: "OPEN", zoneId },
          })
        }
      >
        <Text style={styles.alertShortcutTitle}>{t("iot.metrics.zone.viewZoneAlerts")}</Text>
        <Text style={styles.alertShortcutMeta}>
          {t("iot.metrics.zone.openAlertsCount", {
            count:
              overviewQuery.data?.openAlertCount ??
              overviewQuery.data?.openAlerts ??
              overviewQuery.data?.alertSummary?.totalOpen ??
              0,
          })}
        </Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("iot.metrics.zone.latestReadings")}</Text>
        <DeviceReadingList readings={readings} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("iot.metrics.zone.chartTitle")}</Text>
        <View style={styles.selectorBlock}>
          <Text style={styles.selectorLabel}>{t("iot.metrics.zone.sensor")}</Text>
          <SensorSelector
            onChange={setSelectedSensor}
            readings={readings}
            value={selectedSensor}
          />
        </View>
        <View style={styles.selectorBlock}>
          <Text style={styles.selectorLabel}>{t("iot.metrics.zone.range")}</Text>
          <RangeSelector onChange={setSelectedRange} value={selectedRange} />
        </View>
        <SensorChartCard
          chart={chartQuery.data}
          error={chartQuery.isError}
          loading={chartQuery.isFetching}
          range={selectedRange}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  alertShortcut: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  alertShortcutMeta: {
    color: "#be123c",
    fontSize: 13,
    marginTop: 5,
  },
  alertShortcutTitle: {
    color: "#881337",
    fontSize: 16,
    fontWeight: "900",
  },
  backText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
  centered: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 34,
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  errorText: {
    color: "#be123c",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  errorTitle: {
    color: "#881337",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  header: {
    gap: 6,
  },
  hint: {
    color: "#64748b",
    fontSize: 13,
  },
  kicker: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  loadingBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 16,
  },
  retryButton: {
    backgroundColor: "#be123c",
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
  selectorBlock: {
    gap: 8,
  },
  selectorLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});
