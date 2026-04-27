import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, QrCode, Keyboard, CheckCircle2 } from "lucide-react-native";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
  };
};

export function DeviceOnboardingScreen() {
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

  useEffect(() => {
    if (!payloadParam) {
      return;
    }

    const result = parseDeviceQrPayload(payloadParam);
    if (result.ok) {
      setQrPayload(result.payload);
      setManualPayload(result.payload);
      setMode("scan");
      setError(null);
      return;
    }

    setError(result.error);
  }, [payloadParam]);

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

    if (location.zoneName || location.zoneId) {
      setDeviceName(`Cảm biến - ${location.zoneName || location.zoneId}`);
      return;
    }

    setDeviceName("Thiết bị IoT");
  }, [deviceName, effectivePayload, location.zoneId, location.zoneName]);

  const canConnect =
    Boolean(effectivePayload) && Boolean(location.farmPlotId) && Boolean(location.zoneId);
  const isSubmitting =
    provisionMutation.isPending ||
    claimCodeMutation.isPending ||
    claimMutation.isPending ||
    Boolean(progressStep);

  const updateLocation = (nextLocation: FarmZoneSelection) => {
    setLocation(nextLocation);

    const canUseZoneSuggestion =
      !effectivePayload?.model &&
      (!deviceName ||
        deviceName === "Thiết bị IoT" ||
        deviceName.startsWith("Cảm biến - "));

    if (canUseZoneSuggestion && (nextLocation.zoneName || nextLocation.zoneId)) {
      setDeviceName(`Cảm biến - ${nextLocation.zoneName || nextLocation.zoneId}`);
    }
  };

  const connectDevice = async () => {
    setError(null);

    if (!effectivePayload) {
      setError("Vui lòng quét QR hoặc nhập đủ deviceUid, deviceCode và deviceType.");
      return;
    }

    if (!location.farmPlotId || !location.zoneId) {
      setError("Vui lòng chọn vườn và khu vực lắp đặt.");
      return;
    }

    try {
      setProgressStep("Đang đăng ký thiết bị...");
      const provisioned = await provisionMutation.mutateAsync({
        deviceUid: effectivePayload.deviceUid,
        deviceCode: effectivePayload.deviceCode,
        deviceType: effectivePayload.deviceType,
        deviceName: deviceName.trim() || effectivePayload.model || "Thiết bị IoT",
      });

      setProgressStep("Đang tạo mã xác nhận...");
      const claimCode = await claimCodeMutation.mutateAsync(provisioned.id);

      setProgressStep("Đang gán thiết bị vào khu vực...");
      const claimed = await claimMutation.mutateAsync({
        deviceUid: provisioned.deviceUid,
        claimCode: claimCode.claimCode,
        farmPlotId: location.farmPlotId,
        zoneId: location.zoneId,
      });

      setProgressStep("Đang cập nhật danh sách...");
      const refreshedDevices = await collectorApi.getMyDevices({
        page: 0,
        size: 100,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      const resolved =
        claimed ||
        refreshedDevices.items.find(
          (device) => device.deviceUid === provisioned.deviceUid,
        ) ||
        provisioned;

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#0f172a" size={20} />
        <Text style={styles.backText}>Thiết bị IoT</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.kicker}>Kết nối thiết bị</Text>
        <Text style={styles.title}>Thêm thiết bị IoT</Text>
        <Text style={styles.subtitle}>
          Quét mã QR hoặc nhập thủ công, sau đó chọn vườn/khu vực để gán thiết bị.
        </Text>
      </View>

      <View style={styles.modeRow}>
        <ModeButton
          active={mode === "scan"}
          icon={<QrCode color={mode === "scan" ? "#166534" : "#64748b"} size={18} />}
          label="Quét mã QR"
          onPress={() => setMode("scan")}
        />
        <ModeButton
          active={mode === "manual"}
          icon={<Keyboard color={mode === "manual" ? "#166534" : "#64748b"} size={18} />}
          label="Nhập thủ công"
          onPress={() => setMode("manual")}
        />
      </View>

      {mode === "scan" ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quét QR thiết bị</Text>
          <Text style={styles.hint}>
            QR cần chứa deviceUid, deviceCode, deviceType và có thể có model.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/iot/qr-scan")}
          >
            <QrCode color="#ffffff" size={18} />
            <Text style={styles.primaryButtonText}>Mở camera quét QR</Text>
          </Pressable>
        </View>
      ) : (
        <DeviceQrPayloadForm value={manualPayload} onChange={setManualPayload} />
      )}

      {effectivePayload ? (
        <View style={styles.deviceInfoCard}>
          <View style={styles.infoHeader}>
            <CheckCircle2 color="#16a34a" size={20} />
            <Text style={styles.cardTitle}>Thông tin thiết bị đã đọc</Text>
          </View>
          <InfoLine label="Model" value={effectivePayload.model || "Không có"} />
          <InfoLine label="Device code" value={effectivePayload.deviceCode} />
          <InfoLine label="Device UID" value={effectivePayload.deviceUid} />
          <InfoLine label="Device type" value={effectivePayload.deviceType} />
        </View>
      ) : null}

      <FarmZonePicker value={location} onChange={updateLocation} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tên hiển thị</Text>
        <TextInput
          onChangeText={setDeviceName}
          placeholder="Thiết bị IoT"
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
          <Text style={styles.successTitle}>Kết nối thiết bị thành công</Text>
          <Text style={styles.successText}>
            {successDevice.deviceName || successDevice.deviceCode} đã được gán vào{" "}
            {location.farmPlotName || location.farmPlotId} /{" "}
            {location.zoneName || location.zoneId}.
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
          {isSubmitting ? "Đang kết nối..." : "Kết nối thiết bị"}
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
  title: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});
