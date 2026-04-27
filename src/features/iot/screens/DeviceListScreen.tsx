import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DeviceCard } from "../components/DeviceCard";
import { DeviceEmptyState } from "../components/DeviceEmptyState";
import { useMyDevices } from "../hooks/useDevices";
import type { DeviceResponse } from "../types";

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
    return "Bạn không có quyền xem danh sách thiết bị.";
  }

  if (status === 404) {
    return "Không tìm thấy dữ liệu thiết bị.";
  }

  return "Không kết nối được máy chủ. Vui lòng thử lại.";
};

export function DeviceListScreen() {
  const router = useRouter();
  const devicesQuery = useMyDevices({
    page: 0,
    size: 50,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const devices = devicesQuery.data?.items ?? [];

  const openDevice = (device: DeviceResponse) => {
    router.push({
      pathname: "/iot/devices/[deviceId]",
      params: { deviceId: device.id },
    });
  };

  if (devicesQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#15803d" size="large" />
        <Text style={styles.loadingText}>Đang tải thiết bị...</Text>
      </View>
    );
  }

  if (devicesQuery.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Thiết bị IoT</Text>
          <Text style={styles.subtitle}>
            Theo dõi trạng thái và dữ liệu cảm biến trong vườn.
          </Text>
        </View>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Không tải được danh sách</Text>
          <Text style={styles.errorText}>{getFriendlyError(devicesQuery.error)}</Text>
          <Pressable style={styles.retryButton} onPress={() => devicesQuery.refetch()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={devices}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<DeviceEmptyState />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>Leafy IoT</Text>
              <Text style={styles.title}>Thiết bị IoT</Text>
              <Text style={styles.subtitle}>
                Theo dõi trạng thái online, vị trí gắn và dữ liệu cảm biến mới nhất.
              </Text>
            </View>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/iot/onboarding")}
            >
              <Plus color="#ffffff" size={18} />
              <Text style={styles.addButtonText}>Thêm</Text>
            </Pressable>
          </View>
        </View>
      }
      refreshControl={
        <RefreshControl
          onRefresh={devicesQuery.refetch}
          refreshing={devicesQuery.isRefetching}
          tintColor="#15803d"
        />
      }
      renderItem={({ item }) => <DeviceCard device={item} onPress={openDevice} />}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    flex: 1,
    justifyContent: "center",
  },
  addButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#15803d",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
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
  },
  errorTitle: {
    color: "#881337",
    fontSize: 17,
    fontWeight: "900",
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    paddingRight: 10,
  },
  headerTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kicker: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  listContent: {
    backgroundColor: "#f8fafc",
    flexGrow: 1,
    padding: 18,
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
    marginTop: 12,
  },
  retryButton: {
    alignSelf: "flex-start",
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
    padding: 18,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  title: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 4,
  },
});
