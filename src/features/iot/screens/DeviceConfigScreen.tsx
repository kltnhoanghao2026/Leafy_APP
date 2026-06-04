import { useLocalSearchParams, useRouter } from "expo-router";
import { RefreshCw, Send } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ConfigForm } from "../components/ConfigForm";
import { ConfigPushProgress } from "../components/ConfigPushProgress";
import { ConfigStatusCard } from "../components/ConfigStatusCard";
import { collectorApi } from "../api/collector.api";
import { useDeviceDetail } from "../hooks/useDeviceDetail";
import {
  useDeviceConfig,
  usePushDeviceConfigMutation,
  useUpdateDeviceConfigMutation,
} from "../hooks/useDeviceConfig";
import type { DeviceConfigPushStatus, DeviceConfigResponse } from "../types";
import {
  createFormValuesFromConfig,
  type ConfigFormValues,
  validateConfigForm,
} from "../utils/configValidation";
import { getOnboardingErrorMessage } from "../utils/onboardingErrors";

type PushState = "idle" | "sending" | "waiting" | "acked" | "failed" | "timeout";

const pollIntervalMs = 3_000;
const pollTimeoutMs = 45_000;

const getParamValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const isTerminalStatus = (status?: DeviceConfigPushStatus | null): boolean => {
  return status === "ACKED" || status === "FAILED";
};

export function DeviceConfigScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ deviceId?: string | string[] }>();
  const deviceId = getParamValue(params.deviceId);
  const detailQuery = useDeviceDetail(deviceId);
  const configQuery = useDeviceConfig(deviceId);
  const updateMutation = useUpdateDeviceConfigMutation(deviceId);
  const pushMutation = usePushDeviceConfigMutation(deviceId);
  const [form, setForm] = useState<ConfigFormValues>(createFormValuesFromConfig());
  const [formInitialized, setFormInitialized] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushState>("idle");
  const [pushError, setPushError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartedAtRef = useRef<number | null>(null);

  const device = detailQuery.data;
  const config = configQuery.data;

  const readiness = useMemo(() => {
    if (!device) {
      return { ready: false, reasonKey: "iot.config.readiness.loadingDevice" };
    }

    if (device.isActive === false) {
      return { ready: false, reasonKey: "iot.config.readiness.inactive" };
    }

    if (device.provisioningStatus !== "CLAIMED") {
      return { ready: false, reasonKey: "iot.config.readiness.unclaimed" };
    }

    if (device.status === "DISABLED") {
      return { ready: false, reasonKey: "iot.config.readiness.disabled" };
    }

    return { ready: true, reasonKey: null };
  }, [device]);

  useEffect(() => {
    if (config && !formInitialized) {
      setForm(createFormValuesFromConfig(config));
      setFormInitialized(true);
    }
  }, [config, formInitialized]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const initialForm = useMemo(() => createFormValuesFromConfig(config), [config]);
  const changed = JSON.stringify(form) !== JSON.stringify(initialForm);
  const isRefreshing = configQuery.isRefetching || detailQuery.isRefetching;

  const refresh = () => {
    detailQuery.refetch();
    configQuery.refetch();
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleTerminalConfig = (nextConfig: DeviceConfigResponse) => {
    if (nextConfig.lastPushStatus === "ACKED") {
      setPushState("acked");
      setPushError(null);
      stopPolling();
      configQuery.refetch();
      detailQuery.refetch();
      return;
    }

    if (nextConfig.lastPushStatus === "FAILED") {
      setPushState("failed");
      setPushError(nextConfig.lastPushError || t("iot.config.pushProgress.failed"));
      stopPolling();
      configQuery.refetch();
      detailQuery.refetch();
    }
  };

  const startAckPolling = () => {
    if (!deviceId) {
      return;
    }

    stopPolling();
    pollStartedAtRef.current = Date.now();
    setPushState("waiting");
    setPushError(null);

    pollTimerRef.current = setInterval(async () => {
      if (!pollStartedAtRef.current) {
        return;
      }

      if (Date.now() - pollStartedAtRef.current >= pollTimeoutMs) {
        setPushState("timeout");
        setPushError(t("iot.config.ackTimeoutMessage"));
        stopPolling();
        configQuery.refetch();
        detailQuery.refetch();
        return;
      }

      try {
        const nextConfig = await collectorApi.getDeviceConfig(deviceId);
        if (isTerminalStatus(nextConfig.lastPushStatus)) {
          handleTerminalConfig(nextConfig);
        }
      } catch {
        // Keep polling until timeout. A transient network issue should not end the wait early.
      }
    }, pollIntervalMs);
  };

  const saveConfig = async () => {
    setMessage(null);
    const validation = validateConfigForm(form);
    if (!validation.ok) {
      setMessage(t(validation.errors[0] || "iot.config.validation.invalid"));
      return;
    }

    try {
      await updateMutation.mutateAsync(validation.payload);
      setFormInitialized(false);
      setMessage(t("iot.config.updateSuccess"));
    } catch (error) {
      setMessage(getOnboardingErrorMessage(error));
    }
  };

  const pushConfig = async () => {
    setMessage(null);
    setPushError(null);

    if (!readiness.ready) {
      setMessage(readiness.reasonKey ? t(readiness.reasonKey) : null);
      return;
    }

    try {
      setPushState("sending");
      const pushedConfig = await pushMutation.mutateAsync();
      if (isTerminalStatus(pushedConfig.lastPushStatus)) {
        handleTerminalConfig(pushedConfig);
        return;
      }

      startAckPolling();
    } catch (error) {
      setPushState("failed");
      setPushError(getOnboardingErrorMessage(error));
    }
  };

  if (!deviceId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{t("iot.config.missingDeviceId")}</Text>
        <Text style={styles.errorText}>{t("iot.config.missingDeviceIdDescription")}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>{t("iot.common.back")}</Text>
        </Pressable>
      </View>
    );
  }

  if (configQuery.isLoading || detailQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#15803d" size="large" />
        <Text style={styles.loadingText}>{t("iot.config.loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl onRefresh={refresh} refreshing={isRefreshing} tintColor="#15803d" />
      }
      style={styles.screen}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>{t("iot.config.kicker")}</Text>
        <Text style={styles.title}>{t("iot.config.title")}</Text>
        <Text style={styles.subtitle}>
          {device?.deviceName || device?.deviceCode || t("iot.devices.defaultName")}
        </Text>
      </View>

      {!readiness.ready ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>{t("iot.config.notReadyTitle")}</Text>
          <Text style={styles.warningText}>
            {readiness.reasonKey ? t(readiness.reasonKey) : ""}
          </Text>
        </View>
      ) : device?.status !== "ONLINE" ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>{t("iot.config.offlineWarningTitle")}</Text>
          <Text style={styles.warningText}>
            {t("iot.config.offlineWarningDescription")}
          </Text>
        </View>
      ) : null}

      {configQuery.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>{t("iot.config.loadFailed")}</Text>
          <Text style={styles.errorText}>{t("iot.config.loadFailedDescription")}</Text>
          <Pressable style={styles.retryButton} onPress={() => configQuery.refetch()}>
            <RefreshCw color="#ffffff" size={16} />
            <Text style={styles.retryText}>{t("iot.common.retry")}</Text>
          </Pressable>
        </View>
      ) : null}

      <ConfigStatusCard config={config} />

      <ConfigForm
        changed={changed}
        disabled={!readiness.ready || configQuery.isError}
        onChange={setForm}
        onSubmit={saveConfig}
        saving={updateMutation.isPending}
        value={form}
      />

      {message ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      <ConfigPushProgress state={pushState} error={pushError} />

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={refresh}>
          <RefreshCw color="#166534" size={16} />
          <Text style={styles.secondaryButtonText}>{t("iot.config.reload")}</Text>
        </Pressable>
        <Pressable
          disabled={
            !readiness.ready ||
            configQuery.isError ||
            pushMutation.isPending ||
            pushState === "sending" ||
            pushState === "waiting"
          }
          onPress={pushConfig}
          style={[
            styles.primaryButton,
            (!readiness.ready ||
              configQuery.isError ||
              pushMutation.isPending ||
              pushState === "sending" ||
              pushState === "waiting") &&
              styles.primaryButtonDisabled,
          ]}
        >
          <Send color="#ffffff" size={16} />
          <Text style={styles.primaryButtonText}>{t("iot.config.pushToDevice")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
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
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#15803d",
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 13,
  },
  primaryButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
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
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: "#166534",
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
  warningBox: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  warningText: {
    color: "#92400e",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  warningTitle: {
    color: "#78350f",
    fontSize: 15,
    fontWeight: "900",
  },
});
