import { useLocalSearchParams, useRouter } from "expo-router";
import { BellRing, RefreshCw } from "lucide-react-native";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  type FlatList as FlatListType,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useFarmPlots, useFarmZones } from "@/src/features/farm";
import { farmZonesQueryOptions } from "@/src/features/farm/hooks/useFarmZones";
import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";
import { AlertEventCard } from "../components/AlertEventCard";
import {
  AlertFilters,
  type AlertTimeRange,
} from "../components/AlertFilters";
import { useAlertEvents } from "../hooks/useAlerts";
import { useMyDevices } from "../hooks/useDevices";
import type { AlertEventsParams, AlertEventItemResponse, AlertSeverity, AlertStatus } from "../types";
import { getAlertTimeRange } from "../utils/alertLabels";
import { withAlertContextDisplay } from "../utils/iotDisplay";

const getParamValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export function AlertEventsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    status?: string | string[];
    severity?: string | string[];
    deviceId?: string | string[];
    zoneId?: string | string[];
    highlightAlertId?: string | string[];
  }>();
  const [status, setStatus] = useState<AlertStatus | undefined>(
    getParamValue(params.status),
  );
  const [severity, setSeverity] = useState<AlertSeverity | undefined>(
    getParamValue(params.severity),
  );
  const [deviceId, setDeviceId] = useState(getParamValue(params.deviceId) ?? "");
  const [zoneId, setZoneId] = useState(getParamValue(params.zoneId) ?? "");
  const [farmPlotId, setFarmPlotId] = useState("");
  const [timeRange, setTimeRange] = useState<AlertTimeRange>("D7");
  const highlightedAlertId = getParamValue(params.highlightAlertId);
  const listRef = useRef<FlatListType<AlertEventItemResponse>>(null);
  const profileQuery = useQuery(getMyProfileQueryOptions());
  const devicesQuery = useMyDevices({ page: 0, size: 100 });
  const farmsQuery = useFarmPlots(profileQuery.data?.id);
  const zonesQuery = useFarmZones(farmPlotId || undefined);
  const allZoneQueries = useQueries({
    queries:
      farmsQuery.data?.map((farm) => ({
        ...farmZonesQueryOptions(farm.id),
        enabled: Boolean(farm.id),
      })) ?? [],
  });

  const queryParams = useMemo<AlertEventsParams>(() => {
    const time = getAlertTimeRange(timeRange);

    return {
      page: 0,
      size: 50,
      sortBy: "openedAt",
      sortDir: "desc",
      status,
      severity,
      deviceId: deviceId.trim() || undefined,
      zoneId: zoneId.trim() || undefined,
      ...time,
    };
  }, [deviceId, severity, status, timeRange, zoneId]);

  const alertsQuery = useAlertEvents(queryParams);
  const zones = useMemo(() => {
    const byId = new Map<string, NonNullable<typeof zonesQuery.data>[number]>();
    zonesQuery.data?.forEach((zone) => byId.set(zone.id, zone));
    allZoneQueries.forEach((query) => {
      query.data?.forEach((zone) => byId.set(zone.id, zone));
    });
    return Array.from(byId.values());
  }, [allZoneQueries, zonesQuery.data]);
  const alerts = useMemo(
    () =>
      (alertsQuery.data?.items ?? []).map((alert) =>
        withAlertContextDisplay(alert, {
          devices: devicesQuery.data?.items,
          farms: farmsQuery.data,
          zones,
        }),
      ),
    [alertsQuery.data?.items, devicesQuery.data?.items, farmsQuery.data, zones],
  );
  const highlightedIndex = highlightedAlertId
    ? alerts.findIndex((alert) => alert.id === highlightedAlertId)
    : -1;

  const openAlert = (alert: AlertEventItemResponse) => {
    router.push({
      pathname: "/iot/alerts/[alertId]",
      params: { alertId: alert.id },
    });
  };

  return (
    <FlatList
      ref={listRef}
      contentContainerStyle={styles.content}
      data={alerts}
      onContentSizeChange={() => {
        if (highlightedIndex >= 0) {
          listRef.current?.scrollToIndex({
            index: highlightedIndex,
            animated: true,
            viewPosition: 0.35,
          });
        }
      }}
      onScrollToIndexFailed={() => undefined}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        alertsQuery.isLoading ? null : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t("iot.alerts.emptyTitle")}</Text>
            <Text style={styles.emptyText}>
              {t("iot.alerts.emptyDescription")}
            </Text>
          </View>
        )
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.header}>
            <Text style={styles.kicker}>{t("iot.alerts.kicker")}</Text>
            <Text style={styles.title}>{t("iot.alerts.title")}</Text>
            <Text style={styles.subtitle}>
              {t("iot.alerts.description")}
            </Text>
          </View>
          <Pressable
            style={styles.rulesButton}
            onPress={() => router.push("/iot/alerts/rules")}
          >
            <BellRing color="#166534" size={16} />
            <Text style={styles.rulesButtonText}>
              {t("iot.alertRules.listTitle")}
            </Text>
          </Pressable>
          <AlertFilters
            deviceId={deviceId}
            devices={devicesQuery.data?.items ?? []}
            farmPlotId={farmPlotId}
            farms={farmsQuery.data ?? []}
            severity={severity}
            status={status}
            timeRange={timeRange}
            zoneId={zoneId}
            zones={farmPlotId ? zonesQuery.data ?? [] : zones}
            onChange={(next) => {
              setStatus(next.status);
              setSeverity(next.severity);
              setDeviceId(next.deviceId ?? "");
              setZoneId(next.zoneId ?? "");
              setFarmPlotId(next.farmPlotId ?? "");
              setTimeRange(next.timeRange);
            }}
          />
          {alertsQuery.isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#15803d" />
              <Text style={styles.hint}>{t("iot.alerts.loading")}</Text>
            </View>
          ) : null}
          {alertsQuery.isError && !alerts.length ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{t("iot.alerts.loadFailed")}</Text>
              <Pressable style={styles.retryButton} onPress={() => alertsQuery.refetch()}>
                <RefreshCw color="#ffffff" size={16} />
                <Text style={styles.retryText}>{t("iot.common.retry")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      refreshControl={
        <RefreshControl
          onRefresh={alertsQuery.refetch}
          refreshing={alertsQuery.isRefetching}
          tintColor="#15803d"
        />
      }
      renderItem={({ item }) => (
        <AlertEventCard
          alert={item}
          highlighted={item.id === highlightedAlertId}
          onPress={openAlert}
        />
      )}
      style={styles.screen}
    />
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  backText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
  content: {
    backgroundColor: "#f8fafc",
    flexGrow: 1,
    padding: 18,
    paddingBottom: 34,
  },
  emptyBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 14,
    padding: 16,
  },
  errorText: {
    color: "#be123c",
    fontSize: 14,
  },
  header: {
    gap: 6,
  },
  headerWrap: {
    gap: 16,
    marginBottom: 18,
  },
  hint: {
    color: "#64748b",
    fontSize: 13,
  },
  itemSeparator: {
    height: 16,
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
    flexDirection: "row",
    gap: 10,
    paddingVertical: 6,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#be123c",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  rulesButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rulesButtonText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1,
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
