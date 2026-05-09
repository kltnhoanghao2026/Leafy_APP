import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AlertActionBar } from "../components/AlertActionBar";
import { AlertSeverityBadge } from "../components/AlertSeverityBadge";
import { AlertStatusBadge } from "../components/AlertStatusBadge";
import {
  useAcknowledgeAlertMutation,
  useAlertEventDetail,
  useResolveAlertMutation,
} from "../hooks/useAlerts";
import { formatDateTime } from "../utils/deviceLabels";
import { getOnboardingErrorMessage } from "../utils/onboardingErrors";
import { getSensorLabel, getSensorUnit } from "../utils/sensorLabels";

const getParamValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export function AlertEventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alertId?: string | string[] }>();
  const alertId = getParamValue(params.alertId);
  const alertQuery = useAlertEventDetail(alertId);
  const acknowledgeMutation = useAcknowledgeAlertMutation();
  const resolveMutation = useResolveAlertMutation();
  const [message, setMessage] = useState<string | null>(null);
  const alert = alertQuery.data;
  const sensorCode = alert?.sensorCode || alert?.alertType || undefined;
  const value = alert?.triggerValue ?? alert?.readingValue;
  const unit = getSensorUnit(sensorCode, alert?.unit);

  const acknowledge = async () => {
    if (!alertId) return;
    setMessage(null);
    try {
      await acknowledgeMutation.mutateAsync(alertId);
      setMessage("Da xac nhan canh bao.");
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
      setMessage("Da danh dau canh bao la da xu ly.");
      alertQuery.refetch();
    } catch (error) {
      setMessage(getOnboardingErrorMessage(error));
    }
  };

  if (!alertId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Thieu ma canh bao</Text>
        <Text style={styles.errorText}>Khong the mo chi tiet neu route thieu alertId.</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Quay lai</Text>
        </Pressable>
      </View>
    );
  }

  if (alertQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#15803d" size="large" />
        <Text style={styles.loadingText}>Dang tai chi tiet canh bao...</Text>
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
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#0f172a" size={20} />
        <Text style={styles.backText}>Canh bao IoT</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.kicker}>Alert detail</Text>
        <Text style={styles.title}>Chi tiet canh bao</Text>
        <View style={styles.badges}>
          <AlertSeverityBadge severity={alert?.severity} />
          <AlertStatusBadge status={alert?.status} />
        </View>
      </View>

      {alertQuery.isError || !alert ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Khong tai duoc canh bao</Text>
          <Text style={styles.errorText}>Canh bao khong ton tai hoac ban khong co quyen xem.</Text>
          <Pressable style={styles.retryButton} onPress={() => alertQuery.refetch()}>
            <RefreshCw color="#ffffff" size={16} />
            <Text style={styles.retryText}>Thu lai</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.message}>{alert.message}</Text>
            <InfoLine
              label="Cam bien"
              value={getSensorLabel(sensorCode, alert.sensorName)}
            />
            <InfoLine
              label="Gia tri doc"
              value={
                typeof value === "number"
                  ? `${value.toFixed(1)}${unit ? ` ${unit}` : ""}`
                  : "Khong co"
              }
            />
            <InfoLine
              label="Nguong min/max"
              value={`${alert.thresholdMin ?? "-"} / ${alert.thresholdMax ?? "-"}`}
            />
            <InfoLine label="Device" value={alert.deviceName || alert.deviceId || "-"} />
            <InfoLine label="Zone" value={alert.zoneId || "-"} />
            <InfoLine label="Farm plot" value={alert.farmPlotId || "-"} />
            <InfoLine
              label="Mo luc"
              value={formatDateTime(alert.openedAt || alert.triggeredAt || alert.createdAt)}
            />
            <InfoLine label="Xac nhan luc" value={formatDateTime(alert.acknowledgedAt)} />
            <InfoLine label="Xu ly luc" value={formatDateTime(alert.resolvedAt)} />
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
