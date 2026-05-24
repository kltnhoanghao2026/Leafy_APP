import { useRouter } from "expo-router";
import { BarChart3, Plus } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { DeviceActionsSheet } from "../components/DeviceActionsSheet";
import { DeviceCard } from "../components/DeviceCard";
import { DeviceEmptyState } from "../components/DeviceEmptyState";
import { EditDeviceSheet } from "../components/EditDeviceSheet";
import { ReleaseDeviceConfirmDialog } from "../components/ReleaseDeviceConfirmDialog";
import {
  useMyDevices,
  useReleaseDeviceMutation,
  useUpdateDeviceMutation,
} from "../hooks/useDevices";
import type { DeviceResponse, UpdateDeviceRequest } from "../types";

const getFriendlyError = (error: unknown, t: ReturnType<typeof useTranslation>["t"]): string => {
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
    return t("iot.devices.list.errorAuth");
  }

  if (status === 403) {
    return t("iot.devices.list.errorForbidden");
  }

  if (status === 404) {
    return t("iot.devices.list.errorNotFound");
  }

  return t("iot.devices.list.errorNetwork");
};

const getDeviceLabel = (
  device?: Pick<DeviceResponse, "deviceName" | "deviceCode"> | null,
  fallback = "Selected device",
) => device?.deviceName?.trim() || device?.deviceCode?.trim() || fallback;

const getManagementError = (
  error: unknown,
  t: ReturnType<typeof useTranslation>["t"],
  action: "edit" | "release",
) => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "status" in error.response
      ? error.response.status
      : undefined;

  if (status === 403) return t("iot.devices.release.forbidden");
  if (status === 404) return t("iot.devices.edit.notFound");
  if (status === 400) return t("iot.devices.edit.nameRequired");
  return t(`iot.devices.${action}.error`);
};

export function DeviceListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [actionsDevice, setActionsDevice] = useState<DeviceResponse | null>(null);
  const [editingDevice, setEditingDevice] = useState<DeviceResponse | null>(null);
  const [releasingDevice, setReleasingDevice] = useState<DeviceResponse | null>(null);
  const devicesQuery = useMyDevices({
    page: 0,
    size: 50,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const updateDeviceMutation = useUpdateDeviceMutation();
  const releaseDeviceMutation = useReleaseDeviceMutation();

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
        <Text style={styles.loadingText}>{t("iot.devices.list.loading")}</Text>
      </View>
    );
  }

  if (devicesQuery.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("iot.devices.list.title")}</Text>
          <Text style={styles.subtitle}>
            {t("iot.devices.list.errorSubtitle")}
          </Text>
        </View>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>{t("iot.devices.list.loadFailed")}</Text>
          <Text style={styles.errorText}>{getFriendlyError(devicesQuery.error, t)}</Text>
          <Pressable style={styles.retryButton} onPress={() => devicesQuery.refetch()}>
            <Text style={styles.retryButtonText}>{t("iot.common.retry")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const updateDevice = async (payload: UpdateDeviceRequest) => {
    if (!editingDevice) return;
    try {
      await updateDeviceMutation.mutateAsync({
        deviceId: editingDevice.id,
        payload,
      });
      setEditingDevice(null);
      Alert.alert(t("iot.devices.edit.success"));
      devicesQuery.refetch();
    } catch (error) {
      throw new Error(getManagementError(error, t, "edit"));
    }
  };

  const releaseDevice = async () => {
    if (!releasingDevice) return;
    try {
      await releaseDeviceMutation.mutateAsync({ deviceId: releasingDevice.id });
      setReleasingDevice(null);
      Alert.alert(t("iot.devices.release.success"));
      devicesQuery.refetch();
    } catch (error) {
      Alert.alert(t("iot.devices.release.error"), getManagementError(error, t, "release"));
    }
  };

  return (
    <>
      <FlatList
      contentContainerStyle={styles.listContent}
      data={devices}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<DeviceEmptyState />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>{t("iot.devices.list.kicker")}</Text>
              <Text style={styles.title}>{t("iot.devices.list.title")}</Text>
              <Text style={styles.subtitle}>
                {t("iot.devices.list.description")}
              </Text>
            </View>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/iot/onboarding")}
            >
              <Plus color="#ffffff" size={18} />
              <Text style={styles.addButtonText}>{t("iot.common.add")}</Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.dashboardButton}
            onPress={() => router.push("/iot/dashboard")}
          >
            <BarChart3 color="#166534" size={18} />
            <Text style={styles.dashboardButtonText}>{t("iot.devices.list.viewDashboard")}</Text>
          </Pressable>
        </View>
      }
      refreshControl={
        <RefreshControl
          onRefresh={devicesQuery.refetch}
          refreshing={devicesQuery.isRefetching}
          tintColor="#15803d"
        />
      }
      renderItem={({ item }) => (
        <DeviceCard
          device={item}
          onMorePress={setActionsDevice}
          onPress={openDevice}
        />
      )}
      />
      <DeviceActionsSheet
        deviceLabel={getDeviceLabel(actionsDevice, t("iot.common.selectedDevice"))}
        onClose={() => setActionsDevice(null)}
        onEdit={() => {
          setEditingDevice(actionsDevice);
          setActionsDevice(null);
        }}
        onRelease={() => {
          setReleasingDevice(actionsDevice);
          setActionsDevice(null);
        }}
        visible={Boolean(actionsDevice)}
      />
      <EditDeviceSheet
        device={editingDevice}
        isSubmitting={updateDeviceMutation.isPending}
        onClose={() => setEditingDevice(null)}
        onSubmit={updateDevice}
        visible={Boolean(editingDevice)}
      />
      <ReleaseDeviceConfirmDialog
        deviceLabel={getDeviceLabel(releasingDevice, t("iot.common.selectedDevice"))}
        isSubmitting={releaseDeviceMutation.isPending}
        onCancel={() => setReleasingDevice(null)}
        onConfirm={releaseDevice}
        visible={Boolean(releasingDevice)}
      />
    </>
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
  dashboardButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dashboardButtonText: {
    color: "#166534",
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
