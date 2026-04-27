import { CameraView, type BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, ClipboardCheck } from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { encodeQrPayloadParam, parseDeviceQrPayload } from "../utils/qrPayload";

export function DeviceQrScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualJson, setManualJson] = useState("");
  const [error, setError] = useState<string | null>(null);

  const usePayload = (rawValue: string) => {
    const result = parseDeviceQrPayload(rawValue);
    if (!result.ok) {
      setError(result.error);
      setScanned(false);
      return;
    }

    setError(null);
    router.replace({
      pathname: "/iot/onboarding",
      params: { payload: encodeQrPayloadParam(result.payload) },
    });
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) {
      return;
    }

    setScanned(true);
    usePayload(result.data);
  };

  const hasPermission = permission?.granted;
  const canAskAgain = permission?.canAskAgain ?? true;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#0f172a" size={20} />
        <Text style={styles.backText}>Thêm thiết bị</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.kicker}>QR scanner</Text>
        <Text style={styles.title}>Quét mã QR thiết bị</Text>
        <Text style={styles.subtitle}>
          Đưa mã QR vào khung camera. Sau khi đọc hợp lệ, app sẽ tự quay về bước
          chọn vị trí.
        </Text>
      </View>

      <View style={styles.cameraCard}>
        {!permission ? (
          <Text style={styles.hint}>Đang kiểm tra quyền camera...</Text>
        ) : null}

        {permission && !hasPermission ? (
          <View style={styles.permissionBox}>
            <Camera color="#64748b" size={28} />
            <Text style={styles.permissionTitle}>Cần quyền camera</Text>
            <Text style={styles.hint}>
              Cho phép camera để quét QR. Nếu đã từ chối quyền, hãy mở cài đặt hệ
              thống để cấp lại.
            </Text>
            {canAskAgain ? (
              <Pressable style={styles.primaryButton} onPress={requestPermission}>
                <Text style={styles.primaryButtonText}>Cấp quyền camera</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {hasPermission ? (
          <View style={styles.cameraWrap}>
            <CameraView
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              style={styles.camera}
            />
            <View style={styles.scanFrame} />
          </View>
        ) : null}
      </View>

      <View style={styles.fallbackCard}>
        <View style={styles.fallbackHeader}>
          <ClipboardCheck color="#15803d" size={20} />
          <Text style={styles.cardTitle}>Dán JSON để kiểm thử</Text>
        </View>
        <TextInput
          multiline
          onChangeText={setManualJson}
          placeholder='{"deviceUid":"LEAFY-ESP32-001","deviceCode":"ESP32-001","deviceType":"ESP32_CAM_SENSOR","model":"Leafy IoT Module V1"}'
          placeholderTextColor="#94a3b8"
          style={styles.textArea}
          value={manualJson}
        />
        <Pressable style={styles.secondaryButton} onPress={() => usePayload(manualJson)}>
          <Text style={styles.secondaryButtonText}>Dùng nội dung này</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </ScrollView>
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
  camera: {
    height: 320,
    width: "100%",
  },
  cameraCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  cameraWrap: {
    overflow: "hidden",
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 34,
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
  fallbackCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  fallbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  header: {
    gap: 6,
  },
  hint: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  kicker: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  permissionBox: {
    alignItems: "center",
    gap: 10,
    padding: 24,
  },
  permissionTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
  primaryButton: {
    backgroundColor: "#15803d",
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  scanFrame: {
    borderColor: "#22c55e",
    borderRadius: 22,
    borderWidth: 3,
    height: 210,
    left: "15%",
    position: "absolute",
    top: 55,
    width: "70%",
  },
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
  },
  textArea: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 14,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 13,
    minHeight: 130,
    padding: 12,
    textAlignVertical: "top",
  },
  title: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});
