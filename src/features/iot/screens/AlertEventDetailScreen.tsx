import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react-native";
import { useMemo, useState } from "react";
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

import { AlertActionBar } from "../components/AlertActionBar";
import { AlertSeverityBadge } from "../components/AlertSeverityBadge";
import { AlertStatusBadge } from "../components/AlertStatusBadge";
import {
  useAcknowledgeAlertMutation,
  useAlertEventDetail,
  useResolveAlertMutation,
} from "../hooks/useAlerts";
import { useFarmPlots } from "@/src/features/farm";
import { farmZonesQueryOptions } from "@/src/features/farm/hooks/useFarmZones";
import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";
import { useMyDevices } from "../hooks/useDevices";
import type { DisplayAlertEvent } from "../utils/iotDisplay";
import { withAlertContextDisplay } from "../utils/iotDisplay";
import { getOnboardingErrorMessage } from "../utils/onboardingErrors";

const getParamValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export function AlertEventDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ alertId?: string | string[] }>();
  const alertId = getParamValue(params.alertId);
  const alertQuery = useAlertEventDetail(alertId);
  const profileQuery = useQuery(getMyProfileQueryOptions());
  const devicesQuery = useMyDevices({ page: 0, size: 100 });
  const farmsQuery = useFarmPlots(profileQuery.data?.id);
  const allZoneQueries = useQueries({
    queries:
      farmsQuery.data?.map((farm) => ({
        ...farmZonesQueryOptions(farm.id),
        enabled: Boolean(farm.id),
      })) ?? [],
  });
  const acknowledgeMutation = useAcknowledgeAlertMutation();
  const resolveMutation = useResolveAlertMutation();
  const [message, setMessage] = useState<string | null>(null);
  const zones = useMemo(() => {
    const byId = new Map<string, NonNullable<(typeof allZoneQueries)[number]["data"]>[number]>();
    allZoneQueries.forEach((query) => {
      query.data?.forEach((zone) => byId.set(zone.id, zone));
    });
    return Array.from(byId.values());
  }, [allZoneQueries]);
  const alert = useMemo(() => {
    if (!alertQuery.data) return undefined;
    return withAlertContextDisplay(alertQuery.data, {
      devices: devicesQuery.data?.items,
      farms: farmsQuery.data,
      zones,
    }) as typeof alertQuery.data & Partial<DisplayAlertEvent>;
  }, [alertQuery.data, devicesQuery.data?.items, farmsQuery.data, zones]);

  const acknowledge = async () => {
    if (!alertId) return;
    setMessage(null);
    try {
      await acknowledgeMutation.mutateAsync(alertId);
      setMessage(t("iot.alerts.acknowledgeSuccess"));
      alertQuery.refetch();
    } catch (error) {
      setMessage(getOnboardingErrorMessage(error));
    }
  };

  const resolve = async () => {
    if (!alertId) return;
    setMessage(null);
    try {
      await resolveMutation.mutateAsync(alertId);
      setMessage(t("iot.alerts.resolveSuccess"));
      alertQuery.refetch();
    } catch (error) {
      setMessage(getOnboardingErrorMessage(error));
    }
  };

  if (!alertId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{t("iot.alerts.missingAlertId")}</Text>
        <Text style={styles.errorText}>{t("iot.alerts.missingAlertIdDescription")}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>{t("iot.common.back")}</Text>
        </Pressable>
      </View>
    );
  }

  if (alertQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#15803d" size="large" />
        <Text style={styles.loadingText}>{t("iot.alerts.loadingDetail")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={alertQuery.refetch}
          refreshing={alertQuery.isRefetching}
          tintColor="#15803d"
        />
      }
      style={styles.screen}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>{t("iot.alerts.detailKicker")}</Text>
        <Text style={styles.title}>{t("iot.alerts.detailTitle")}</Text>
        <View style={styles.badges}>
          <AlertSeverityBadge severity={alert?.severity} />
          <AlertStatusBadge status={alert?.status} />
        </View>
      </View>

      {alertQuery.isError || !alert ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>{t("iot.alerts.detailLoadFailed")}</Text>
          <Text style={styles.errorText}>{t("iot.alerts.detailLoadFailedDescription")}</Text>
          <Pressable style={styles.retryButton} onPress={() => alertQuery.refetch()}>
            <RefreshCw color="#ffffff" size={16} />
            <Text style={styles.retryText}>{t("iot.common.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.message}>{alert.display?.title ?? alert.display?.message ?? t("iot.alerts.notificationBody")}</Text>
            <InfoLine
              label={t("iot.metrics.zone.sensor")}
              value={alert.display?.sensorLabel ?? t("iot.common.unknown")}
            />
            <InfoLine
              label={t("iot.alerts.readingValue")}
              value={alert.display?.valueLabel ?? t("iot.common.unknownValue")}
            />
            <InfoLine
              label={t("iot.alerts.thresholdMinMax")}
              value={alert.display?.thresholdLabel ?? t("iot.common.unknownValue")}
            />
            <InfoLine label={t("iot.common.device")} value={alert.display?.deviceLabel ?? t("iot.common.unknownDevice")} />
            <InfoLine label={t("iot.common.zone")} value={alert.display?.zoneLabel ?? t("iot.common.unknownZone")} />
            <InfoLine label={t("iot.common.farm")} value={alert.display?.farmLabel ?? t("iot.common.unknownFarm")} />
            <InfoLine
              label={t("iot.alerts.openedAt")}
              value={alert.display?.openedAtLabel ?? t("iot.common.noData")}
            />
            <InfoLine label={t("iot.alerts.acknowledgedAt")} value={alert.display?.acknowledgedAtLabel ?? t("iot.common.noData")} />
            <InfoLine label={t("iot.alerts.resolvedAt")} value={alert.display?.resolvedAtLabel ?? t("iot.common.noData")} />
          </View>

          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          <AlertActionBar
            acknowledging={acknowledgeMutation.isPending}
            resolving={resolveMutation.isPending}
            status={alert.status}
            onAcknowledge={acknowledge}
            onResolve={resolve}
          />
        </>
      )}
    </ScrollView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
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
    gap: 10,
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
  infoLabel: {
    color: "#64748b",
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  infoLine: {
    flexDirection: "row",
    gap: 10,
  },
  infoValue: {
    color: "#0f172a",
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  kicker: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
    marginTop: 12,
  },
  message: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
  },
  messageBox: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  messageText: {
    color: "#1e40af",
    fontSize: 14,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#be123c",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  title: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});
