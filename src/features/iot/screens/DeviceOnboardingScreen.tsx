import { useLocalSearchParams, useRouter } from "expo-router";
import { QrCode, Keyboard, CheckCircle2 } from "lucide-react-native";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { collectorApi } from "../api/collector.api";
import { DeviceQrPayloadForm } from "../components/DeviceQrPayloadForm";
import {
  FarmZonePicker,
  type FarmZoneSelection,
} from "../components/FarmZonePicker";
import { OnboardingProgress } from "../components/OnboardingProgress";
import { WifiSetupGuide } from "../components/WifiSetupGuide";
import {
  useClaimDeviceMutation,
  useConnectDeviceMutation,
  useGenerateClaimCodeMutation,
  useProvisionDeviceMutation,
} from "../hooks/useDeviceOnboarding";
import type { DeviceQrPayload, DeviceResponse } from "../types";
import { getOnboardingErrorMessage } from "../utils/onboardingErrors";
import { parseDeviceQrPayload } from "../utils/qrPayload";

type OnboardingMode = "scan" | "manual";

const getParamValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const normalizeManualPayload = (
  value: Partial<DeviceQrPayload>,
): DeviceQrPayload | null => {
  const deviceUid = value.deviceUid?.trim();
  const deviceCode = value.deviceCode?.trim();
  const deviceType = value.deviceType?.trim();

  if (!deviceUid || !deviceCode || !deviceType) {
    return null;
  }

  return {
    deviceUid,
    deviceCode,
    deviceType,
    model: value.model?.trim() || undefined,
    firmwareVersion: value.firmwareVersion?.trim() || undefined,
    setupApSsid: value.setupApSsid?.trim() || undefined,
    setupPortalUrl: value.setupPortalUrl?.trim() || undefined,
  };
};

export function DeviceOnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ payload?: string | string[] }>();
  const payloadParam = getParamValue(params.payload);
  const [mode, setMode] = useState<OnboardingMode>("scan");
  const [qrPayload, setQrPayload] = useState<DeviceQrPayload | null>(null);
  const [manualPayload, setManualPayload] = useState<Partial<DeviceQrPayload>>({});
  const [location, setLocation] = useState<FarmZoneSelection>({});
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<string | undefined>();
  const [successDevice, setSuccessDevice] = useState<DeviceResponse | null>(null);
  const [showWifiGuide, setShowWifiGuide] = useState(false);

  const provisionMutation = useProvisionDeviceMutation();
  const claimCodeMutation = useGenerateClaimCodeMutation();
  const claimMutation = useClaimDeviceMutation();
  const connectMutation = useConnectDeviceMutation();
  const defaultDeviceName = t("iot.devices.defaultName");
  const suggestedSensorName = (zone?: string) =>
    t("iot.devices.onboarding.suggestedSensorName", {
      zone: zone || t("iot.common.unknown"),
    });

  useEffect(() => {
    if (!payloadParam) {
      return;
    }

    const result = parseDeviceQrPayload(payloadParam, t);
    if (result.ok) {
      setQrPayload(result.payload);
      setManualPayload(result.payload);
      setMode("scan");
      setError(null);
      return;
    }

    setError(result.error);
  }, [payloadParam, t]);

  const effectivePayload = useMemo(() => {
    if (mode === "manual") {
      return normalizeManualPayload(manualPayload);
    }

    return qrPayload;
  }, [manualPayload, mode, qrPayload]);

  useEffect(() => {
    if (deviceName || !effectivePayload) {
      return;
    }

    if (effectivePayload.model) {
      setDeviceName(effectivePayload.model);
      return;
    }

    if (location.zoneName) {
      setDeviceName(suggestedSensorName(location.zoneName));
      return;
    }

    setDeviceName(defaultDeviceName);
  }, [defaultDeviceName, deviceName, effectivePayload, location.zoneId, location.zoneName]);

  const canConnect =
    Boolean(effectivePayload) && Boolean(location.farmPlotId) && Boolean(location.zoneId);
  const hasSetupHints = Boolean(
    effectivePayload?.firmwareVersion ||
      effectivePayload?.setupApSsid ||
      effectivePayload?.setupPortalUrl,
  );
  const isSubmitting =
    provisionMutation.isPending ||
    claimCodeMutation.isPending ||
    claimMutation.isPending ||
    connectMutation.isPending ||
    Boolean(progressStep);

  const updateLocation = (nextLocation: FarmZoneSelection) => {
    setLocation(nextLocation);

    const canUseZoneSuggestion =
      !effectivePayload?.model &&
      (!deviceName ||
        deviceName === defaultDeviceName ||
        deviceName.startsWith(t("iot.devices.onboarding.suggestedSensorPrefix")));

    if (canUseZoneSuggestion && nextLocation.zoneName) {
      setDeviceName(suggestedSensorName(nextLocation.zoneName));
    }
  };

  const connectDevice = async () => {
    setError(null);

    if (!effectivePayload) {
      setError(t("iot.devices.onboarding.missingDeviceInfo"));
      return;
    }

    if (!location.farmPlotId || !location.zoneId) {
      setError(t("iot.devices.onboarding.missingLocation"));
      return;
    }

    try {
      setProgressStep(t("iot.devices.onboarding.progressProvisioning"));
      const claimed = await connectMutation.mutateAsync({
        deviceUid: effectivePayload.deviceUid,
        deviceCode: effectivePayload.deviceCode,
        deviceType: effectivePayload.deviceType,
        deviceName: deviceName.trim() || effectivePayload.model || defaultDeviceName,
        farmPlotId: location.farmPlotId,
        zoneId: location.zoneId,
      });

      setProgressStep(t("iot.devices.onboarding.progressRefreshing"));
      const refreshedDevices = await collectorApi.getMyDevices({
        page: 0,
        size: 100,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      const resolved =
        refreshedDevices.items.find(
          (device) => device.deviceUid === claimed.deviceUid,
        ) ||
        claimed;

      setSuccessDevice(resolved);
      setShowWifiGuide(resolved.status !== "ONLINE");
      setProgressStep(undefined);

      if (resolved.id) {
        router.replace({
          pathname: "/iot/devices/[deviceId]",
          params: { deviceId: resolved.id },
        });
      }
    } catch (connectError) {
      setProgressStep(undefined);
      setError(getOnboardingErrorMessage(connectError));
    }
  };

  const openSetupPortal = async () => {
    if (!effectivePayload?.setupPortalUrl) {
      return;
    }

    try {
      await Linking.openURL(effectivePayload.setupPortalUrl);
    } catch {
      setError(t("iot.devices.onboarding.openPortalFailed"));
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t("iot.devices.onboarding.kicker")}</Text>
        <Text style={styles.title}>{t("iot.devices.onboarding.title")}</Text>
        <Text style={styles.subtitle}>
          {t("iot.devices.onboarding.description")}
        </Text>
      </View>

      <View style={styles.modeRow}>
        <ModeButton
          active={mode === "scan"}
          icon={<QrCode color={mode === "scan" ? "#166534" : "#64748b"} size={18} />}
          label={t("iot.devices.onboarding.scanQr")}
          onPress={() => setMode("scan")}
        />
        <ModeButton
          active={mode === "manual"}
          icon={<Keyboard color={mode === "manual" ? "#166534" : "#64748b"} size={18} />}
          label={t("iot.devices.onboarding.manual")}
          onPress={() => setMode("manual")}
        />
      </View>

      {mode === "scan" ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("iot.devices.onboarding.scanQrTitle")}</Text>
          <Text style={styles.hint}>
            {t("iot.devices.onboarding.scanQrDescription")}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/iot/qr-scan")}
          >
            <QrCode color="#ffffff" size={18} />
            <Text style={styles.primaryButtonText}>{t("iot.devices.onboarding.openQrCamera")}</Text>
          </Pressable>
        </View>
      ) : (
        <DeviceQrPayloadForm value={manualPayload} onChange={setManualPayload} />
      )}

      {effectivePayload ? (
        <View style={styles.deviceInfoCard}>
          <View style={styles.infoHeader}>
            <CheckCircle2 color="#16a34a" size={20} />
            <Text style={styles.cardTitle}>{t("iot.devices.onboarding.readDeviceInfo")}</Text>
          </View>
          <InfoLine label={t("iot.devices.onboarding.model")} value={effectivePayload.model || t("iot.common.none")} />
          <InfoLine label={t("iot.devices.onboarding.deviceCode")} value={effectivePayload.deviceCode} />
          <InfoLine label={t("iot.devices.onboarding.deviceType")} value={t(`iot.devices.type.${effectivePayload.deviceType}`, { defaultValue: t("iot.devices.defaultName") })} />
        </View>
      ) : null}

      {effectivePayload && hasSetupHints ? (
        <View style={styles.setupInfoCard}>
          <Text style={styles.cardTitle}>{t("iot.devices.onboarding.setupInfoTitle")}</Text>
          <Text style={styles.hintLeft}>{t("iot.devices.onboarding.setupInfoHint")}</Text>
          {effectivePayload.firmwareVersion ? (
            <InfoLine
              label={t("iot.devices.onboarding.setupInfoFirmware")}
              value={effectivePayload.firmwareVersion}
            />
          ) : null}
          {effectivePayload.setupApSsid ? (
            <InfoLine
              label={t("iot.devices.onboarding.setupInfoWifi")}
              value={effectivePayload.setupApSsid}
            />
          ) : null}
          {effectivePayload.setupPortalUrl ? (
            <>
              <InfoLine
                label={t("iot.devices.onboarding.setupInfoPortal")}
                value={effectivePayload.setupPortalUrl}
              />
              <Pressable style={styles.portalButton} onPress={openSetupPortal}>
                <Text style={styles.portalButtonText}>
                  {t("iot.devices.onboarding.setupInfoOpenPortal")}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      <FarmZonePicker value={location} onChange={updateLocation} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("iot.devices.onboarding.displayName")}</Text>
        <TextInput
          onChangeText={setDeviceName}
          placeholder={defaultDeviceName}
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={deviceName}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {progressStep ? <OnboardingProgress currentStep={progressStep} /> : null}

      {successDevice ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>{t("iot.devices.onboarding.successTitle")}</Text>
          <Text style={styles.successText}>
            {t("iot.devices.onboarding.successDescription", {
              device: successDevice.deviceName || successDevice.deviceCode,
              farm: location.farmPlotName || t("iot.common.unknownFarm"),
              zone: location.zoneName || t("iot.common.unknownZone"),
            })}
          </Text>
          {showWifiGuide ? <WifiSetupGuide /> : null}
        </View>
      ) : null}

      <Pressable
        disabled={!canConnect || isSubmitting}
        onPress={connectDevice}
        style={({ pressed }) => [
          styles.connectButton,
          (!canConnect || isSubmitting) && styles.connectButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.connectButtonText}>
          {isSubmitting ? t("iot.devices.onboarding.connecting") : t("iot.devices.onboarding.connectDevice")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeButton, active && styles.modeButtonActive]}
    >
      {icon}
      <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
    </Pressable>
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
    marginBottom: 18,
  },
  backText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
  connectButton: {
    alignItems: "center",
    backgroundColor: "#15803d",
    borderRadius: 999,
    marginTop: 4,
    paddingVertical: 15,
  },
  connectButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 34,
  },
  deviceInfoCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  errorText: {
    color: "#be123c",
    fontSize: 14,
    lineHeight: 20,
  },
  header: {
    gap: 6,
  },
  hint: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
  },
  hintLeft: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
  },
  infoHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  infoLabel: {
    color: "#64748b",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  infoLine: {
    flexDirection: "row",
    gap: 10,
  },
  infoValue: {
    color: "#0f172a",
    flex: 2,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 12,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  kicker: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  modeButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    padding: 13,
  },
  modeButtonActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  modeLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "900",
  },
  modeLabelActive: {
    color: "#166534",
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  pressed: {
    opacity: 0.8,
  },
  portalButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#15803d",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  portalButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#15803d",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
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
  successBox: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  successText: {
    color: "#166534",
    fontSize: 14,
    lineHeight: 20,
  },
  successTitle: {
    color: "#166534",
    fontSize: 17,
    fontWeight: "900",
  },
  setupInfoCard: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  title: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});
