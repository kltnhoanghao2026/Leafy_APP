import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BarChart3, SlidersHorizontal } from "lucide-react-native";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DeviceReadingList } from "../components/DeviceReadingList";
import { DeviceStatusBadge } from "../components/DeviceStatusBadge";
import { WifiSetupGuide } from "../components/WifiSetupGuide";
import {
  useDeviceDetail,
  useDeviceLatestReadings,
} from "../hooks/useDeviceDetail";
import {
  formatDateTime,
  formatDeviceCode,
  getProvisioningStatusLabel,
} from "../utils/deviceLabels";

const getParamValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const getFriendlyError = (error: unknown): string => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "status" in error.response
      ? error.response.status
      : undefined;

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 403) {
    return "Bạn không có quyền xem thiết bị này.";
  }

  if (status === 404) {
    return "Không tìm thấy thiết bị.";
  }

  return "Không kết nối được máy chủ. Vui lòng thử lại.";
};

export function DeviceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deviceId?: string | string[] }>();
  const deviceId = getParamValue(params.deviceId);
  const detailQuery = useDeviceDetail(deviceId);
  const readingsQuery = useDeviceLatestReadings(deviceId);

  const device = detailQuery.data;
  const readings = readingsQuery.data ?? device?.latestReadings ?? [];
  const isRefreshing = detailQuery.isRefetching || readingsQuery.isRefetching;

  const refresh = () => {
    detailQuery.refetch();
    readingsQuery.refetch();
  };

  if (!deviceId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Thiếu mã thiết bị</Text>
        <Text style={styles.errorText}>Không thể mở chi tiết nếu route thiếu deviceId.</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#15803d" size="large" />
        <Text style={styles.loadingText}>Đang tải chi tiết thiết bị...</Text>
      </View>
    );
  }

  if (detailQuery.isError || !device) {
    return (
      <View style={styles.screen}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#0f172a" size={20} />
          <Text style={styles.backText}>Quay lại</Text>
        </Pressable>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Không tải được thiết bị</Text>
          <Text style={styles.errorText}>{getFriendlyError(detailQuery.error)}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={refresh}
          refreshing={isRefreshing}
          tintColor="#15803d"
        />
      }
      style={styles.screen}
    >
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft color="#0f172a" size={20} />
        <Text style={styles.backText}>Danh sách thiết bị</Text>
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>Chi tiết thiết bị</Text>
            <Text style={styles.title}>{device.deviceName || "Thiết bị IoT"}</Text>
            <Text style={styles.code}>
              {formatDeviceCode(device.deviceCode || device.deviceUid)}
            </Text>
          </View>
          <DeviceStatusBadge status={device.status} />
        </View>

        {device.status !== "ONLINE" ? (
          <View style={styles.offlineGuideWrap}>
            <WifiSetupGuide />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
        <View style={styles.infoGrid}>
          <InfoCard label="Loại thiết bị" value={device.deviceType || "Không rõ"} />
          <InfoCard
            label="Kết nối"
            value={getProvisioningStatusLabel(device.provisioningStatus)}
          />
          <InfoCard label="Vườn" value={device.farmPlotId || "Chưa gán"} />
          <InfoCard label="Khu vực" value={device.zoneId || "Chưa gán"} />
          <InfoCard label="Lần cuối online" value={formatDateTime(device.lastSeenAt)} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dữ liệu cảm biến mới nhất</Text>
          {readingsQuery.isFetching ? (
            <ActivityIndicator color="#15803d" size="small" />
          ) : null}
        </View>
        {readingsQuery.isError ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Không tải được dữ liệu cảm biến. Kéo xuống để thử lại.
            </Text>
          </View>
        ) : (
          <DeviceReadingList readings={readings} />
        )}
      </View>

      <View style={styles.actions}>
        <PlaceholderAction
          icon={<SlidersHorizontal color="#64748b" size={18} />}
          title="Cấu hình thiết bị"
          subtitle="Sẽ bổ sung ở Phase 4"
        />
        <PlaceholderAction
          icon={<BarChart3 color="#64748b" size={18} />}
          title="Biểu đồ"
          subtitle="Sẽ bổ sung ở Phase 3"
        />
      </View>
    </ScrollView>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PlaceholderAction({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.placeholderAction}>
      {icon}
      <View style={styles.placeholderTextWrap}>
        <Text style={styles.placeholderTitle}>{title}</Text>
        <Text style={styles.placeholderSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
    marginTop: 6,
  },
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
  centered: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  code: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 6,
  },
  content: {
    padding: 18,
    paddingBottom: 34,
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  errorText: {
    color: "#9f1239",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    textAlign: "center",
  },
  errorTitle: {
    color: "#881337",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  hero: {
    backgroundColor: "#ffffff",
    borderColor: "#dcfce7",
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  heroHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  heroText: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    width: "48%",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
  },
  infoValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
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
  offlineGuideWrap: {
    marginTop: 16,
  },
  placeholderAction: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    opacity: 0.82,
    padding: 14,
  },
  placeholderSubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  placeholderTextWrap: {
    flex: 1,
  },
  placeholderTitle: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  retryButton: {
    alignSelf: "center",
    backgroundColor: "#be123c",
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  warningBox: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  warningText: {
    color: "#9a3412",
    fontSize: 14,
  },
});
