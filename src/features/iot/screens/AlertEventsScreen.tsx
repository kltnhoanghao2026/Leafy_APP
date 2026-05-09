import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, RefreshCw } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AlertEventCard } from "../components/AlertEventCard";
import {
  AlertFilters,
  type AlertTimeRange,
} from "../components/AlertFilters";
import { useAlertEvents } from "../hooks/useAlerts";
import type { AlertEventsParams, AlertEventItemResponse, AlertSeverity, AlertStatus } from "../types";
import { getAlertTimeRange } from "../utils/alertLabels";

const getParamValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export function AlertEventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    status?: string | string[];
    severity?: string | string[];
    deviceId?: string | string[];
    zoneId?: string | string[];
  }>();
  const [status, setStatus] = useState<AlertStatus | undefined>(
    getParamValue(params.status),
  );
  const [severity, setSeverity] = useState<AlertSeverity | undefined>(
    getParamValue(params.severity),
  );
  const [deviceId, setDeviceId] = useState(getParamValue(params.deviceId) ?? "");
  const [zoneId, setZoneId] = useState(getParamValue(params.zoneId) ?? "");
  const [timeRange, setTimeRange] = useState<AlertTimeRange>("D7");

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
  const alerts = alertsQuery.data?.items ?? [];

  const openAlert = (alert: AlertEventItemResponse) => {
    router.push({
      pathname: "/iot/alerts/[alertId]",
      params: { alertId: alert.id },
    });
  };

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={alerts}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        alertsQuery.isLoading ? null : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Khong co canh bao nao</Text>
            <Text style={styles.emptyText}>
              Thu thay doi bo loc hoac kiem tra lai sau khi thiet bi gui telemetry.
            </Text>
          </View>
        )
      }
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#0f172a" size={20} />
            <Text style={styles.backText}>IoT</Text>
          </Pressable>
          <View style={styles.header}>
            <Text style={styles.kicker}>IoT alerts</Text>
            <Text style={styles.title}>Canh bao IoT</Text>
            <Text style={styles.subtitle}>
              Theo doi canh bao theo muc do, trang thai, thiet bi va khu vuc.
            </Text>
          </View>
          <AlertFilters
            deviceId={deviceId}
            severity={severity}
            status={status}
            timeRange={timeRange}
            zoneId={zoneId}
            onChange={(next) => {
              setStatus(next.status);
              setSeverity(next.severity);
              setDeviceId(next.deviceId ?? "");
              setZoneId(next.zoneId ?? "");
              setTimeRange(next.timeRange);
            }}
          />
          {alertsQuery.isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#15803d" />
              <Text style={styles.hint}>Dang tai danh sach canh bao...</Text>
            </View>
          ) : null}
          {alertsQuery.isError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Khong tai duoc danh sach canh bao.</Text>
              <Pressable style={styles.retryButton} onPress={() => alertsQuery.refetch()}>
                <RefreshCw color="#ffffff" size={16} />
                <Text style={styles.retryText}>Thu lai</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      refreshControl={
        <RefreshControl
          onRefresh={alertsQuery.refetch}
          refreshing={alertsQuery.isRefetching}
          tintColor="#15803d"
        />
      }
      renderItem={({ item }) => <AlertEventCard alert={item} onPress={openAlert} />}
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
    marginBottom: 16,
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
