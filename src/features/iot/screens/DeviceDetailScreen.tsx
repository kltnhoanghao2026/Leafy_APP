import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  BarChart3,
  Bell,
  MoreHorizontal,
  SlidersHorizontal,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ScrollView as ScrollViewType,
} from "react-native";

import { useFarmPlots } from "@/src/features/farm";
import { farmZonesQueryOptions } from "@/src/features/farm/hooks/useFarmZones";
import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";
import { DeviceActionsSheet } from "../components/DeviceActionsSheet";
import { DeviceReadingList } from "../components/DeviceReadingList";
import { DeviceChartsPanel } from "../components/DeviceChartsPanel";
import { EditDeviceSheet } from "../components/EditDeviceSheet";
import { DeviceMediaPanel } from "../components/DeviceMediaPanel";
import { ReleaseDeviceConfirmDialog } from "../components/ReleaseDeviceConfirmDialog";
import { DeviceStatusBadge } from "../components/DeviceStatusBadge";
import { IoTActionCard, useIotTheme } from "../components/IoTUi";
import { RangeSelector } from "../components/RangeSelector";
import { SensorChartCard } from "../components/SensorChartCard";
import { SensorSelector } from "../components/SensorSelector";
import { WifiSetupGuide } from "../components/WifiSetupGuide";
import {
  useDeviceDetail,
  useDeviceLatestReadings,
} from "../hooks/useDeviceDetail";
import {
  iotKeys,
  useReleaseDeviceMutation,
  useUpdateDeviceMutation,
} from "../hooks/useDevices";
import {
  formatDateTime,
  formatDeviceCode,
  getProvisioningStatusLabel,
} from "../utils/deviceLabels";
import { useDeviceChart } from "../hooks/useTelemetry";
import type { ChartRange, SensorCode, UpdateDeviceRequest } from "../types";

const getParamValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

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
    return t("iot.devices.detail.errorAuth");
  }

  if (status === 403) {
    return t("iot.devices.detail.errorForbidden");
  }

  if (status === 404) {
    return t("iot.devices.detail.errorNotFound");
  }

  return t("iot.devices.detail.errorNetwork");
};

const getDeviceManagementError = (
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

const getDeviceLabel = (
  device?: { deviceName?: string | null; deviceCode?: string | null } | null,
  fallback = "Selected device",
) => device?.deviceName?.trim() || device?.deviceCode?.trim() || fallback;

export function DeviceDetailScreen() {
  const { t } = useTranslation();
  const theme = useIotTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollViewType>(null);
  const chartSectionY = useRef(0);
  const params = useLocalSearchParams<{ deviceId?: string | string[] }>();
  const deviceId = getParamValue(params.deviceId);
  const profileQuery = useQuery(getMyProfileQueryOptions());
  const farmsQuery = useFarmPlots(profileQuery.data?.id);
  const allZoneQueries = useQueries({
    queries:
      farmsQuery.data?.map((farm) => ({
        ...farmZonesQueryOptions(farm.id),
        enabled: Boolean(farm.id),
      })) ?? [],
  });
  const detailQuery = useDeviceDetail(deviceId);
  const readingsQuery = useDeviceLatestReadings(deviceId);
  const [selectedSensor, setSelectedSensor] = useState<SensorCode>("AIR_TEMP");
  const [selectedRange, setSelectedRange] = useState<ChartRange>("H24");
  const [actionsVisible, setActionsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [releaseVisible, setReleaseVisible] = useState(false);

  const device = detailQuery.data;
  const readings = readingsQuery.data ?? device?.latestReadings ?? [];
  const chartQuery = useDeviceChart(deviceId, selectedSensor, selectedRange);
  const updateDeviceMutation = useUpdateDeviceMutation();
  const releaseDeviceMutation = useReleaseDeviceMutation();
  const isRefreshing = detailQuery.isRefetching || readingsQuery.isRefetching;
  const farmLabel = useMemo(() => {
    if (!device?.farmPlotId) return t("iot.common.noFarmMetadata");
    const farm = farmsQuery.data?.find((item) => item.id === device.farmPlotId);
    return farm?.name || farm?.code || t("iot.common.assigned");
  }, [device?.farmPlotId, farmsQuery.data, t]);
  const zoneLabel = useMemo(() => {
    if (!device?.zoneId) return t("iot.common.noZoneMetadata");
    for (const query of allZoneQueries) {
      const zone = query.data?.find((item) => item.id === device.zoneId);
      if (zone) return zone.zoneName || zone.zoneCode || t("iot.common.assigned");
    }
    return t("iot.common.assigned");
  }, [allZoneQueries, device?.zoneId, t]);
  const deviceTypeLabel = device?.deviceType?.trim() || t("iot.devices.defaultName");

  const scrollToCharts = () => {
    scrollRef.current?.scrollTo({ y: Math.max(chartSectionY.current - 12, 0), animated: true });
  };

  const captureChartSection = (event: LayoutChangeEvent) => {
    chartSectionY.current = event.nativeEvent.layout.y;
  };

  useEffect(() => {
    const firstSensor = readings[0]?.sensorCode;
    if (firstSensor) {
      setSelectedSensor((current) => (current === "AIR_TEMP" ? firstSensor : current));
    }
  }, [readings]);

  const refresh = () => {
    detailQuery.refetch();
    readingsQuery.refetch();
    chartQuery.refetch();
    if (device?.deviceUid) {
      queryClient.invalidateQueries({
        queryKey: iotKeys.deviceCameraSchedules(device.deviceUid),
      });
    }
    if (deviceId) {
      queryClient.invalidateQueries({ queryKey: iotKeys.deviceMedia(deviceId) });
    }
  };

  const updateDevice = async (payload: UpdateDeviceRequest) => {
    if (!deviceId) return;
    try {
      await updateDeviceMutation.mutateAsync({ deviceId, payload });
      setEditVisible(false);
      Alert.alert(t("iot.devices.edit.success"));
      detailQuery.refetch();
    } catch (error) {
      throw new Error(getDeviceManagementError(error, t, "edit"));
    }
  };

  const releaseDevice = async () => {
    if (!deviceId) return;
    try {
      await releaseDeviceMutation.mutateAsync({ deviceId });
      setReleaseVisible(false);
      Alert.alert(t("iot.devices.release.success"));
      router.replace("/iot");
    } catch (error) {
      Alert.alert(
        t("iot.devices.release.error"),
        getDeviceManagementError(error, t, "release"),
      );
    }
  };

  if (!deviceId) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorTitle, { color: theme.danger }]}>{t("iot.devices.detail.missingDeviceId")}</Text>
        <Text style={[styles.errorText, { color: theme.danger }]}>{t("iot.devices.detail.missingDeviceIdDescription")}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>{t("iot.common.back")}</Text>
        </Pressable>
      </View>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={[styles.loadingText, { color: theme.subtle }]}>{t("iot.devices.detail.loading")}</Text>
      </View>
    );
  }

  if ((detailQuery.isError && !device) || !device) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, borderColor: theme.tone("danger").border }]}>
          <Text style={[styles.errorTitle, { color: theme.danger }]}>{t("iot.devices.detail.loadFailed")}</Text>
          <Text style={[styles.errorText, { color: theme.danger }]}>{getFriendlyError(detailQuery.error, t)}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>{t("iot.common.retry")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={refresh}
          refreshing={isRefreshing}
          tintColor={theme.primary}
        />
      }
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroText}>
            <Text style={[styles.kicker, { color: theme.primary }]}>{t("iot.devices.detail.kicker")}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{device.deviceName || device.deviceCode || t("iot.common.selectedDevice")}</Text>
            <Text style={[styles.code, { color: theme.subtle }]}>
              {device.deviceCode ? formatDeviceCode(device.deviceCode) : t("iot.devices.noCode")}
            </Text>
          </View>
          <DeviceStatusBadge status={device.status} />
        </View>

        <Pressable
          accessibilityLabel={t("iot.devices.actions.more")}
          onPress={() => setActionsVisible(true)}
          style={[styles.manageButton, { backgroundColor: theme.primarySoft, borderColor: theme.tone("primary").border }]}
        >
          <MoreHorizontal color={theme.primary} size={20} />
          <Text style={[styles.manageButtonText, { color: theme.primary }]}>{t("iot.devices.actions.more")}</Text>
        </Pressable>

        {device.status !== "ONLINE" ? (
          <View style={styles.offlineGuideWrap}>
            <WifiSetupGuide />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("iot.devices.detail.basicInfo")}</Text>
        <View style={styles.infoGrid}>
          <InfoCard
            label={t("iot.devices.detail.type")}
            value={deviceTypeLabel}
          />
          <InfoCard
            label={t("iot.devices.detail.connection")}
            value={getProvisioningStatusLabel(device.provisioningStatus)}
          />
          <InfoCard label={t("iot.common.farm")} value={farmLabel} />
          <InfoCard label={t("iot.common.zone")} value={zoneLabel} />
          <InfoCard label={t("iot.devices.detail.firmware")} value={device.firmwareVersion ?? t("iot.common.noData")} />
          <InfoCard label={t("iot.devices.detail.lastSeenAt")} value={formatDateTime(device.lastSeenAt)} />
        </View>
      </View>

      <View style={styles.section} onLayout={captureChartSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("iot.devices.detail.latestReadings")}</Text>
          {readingsQuery.isFetching ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : null}
        </View>
        {readingsQuery.isError && !readings.length ? (
          <View style={[styles.warningBox, { backgroundColor: theme.warningSoft, borderColor: theme.tone("warning").border }]}>
            <Text style={[styles.warningText, { color: theme.warning }]}>
              {t("iot.devices.detail.readingsLoadFailed")}
            </Text>
          </View>
        ) : (
          <DeviceReadingList readings={readings} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("iot.devices.detail.sensorChart")}</Text>
        <View style={styles.selectorBlock}>
          <Text style={[styles.selectorLabel, { color: theme.subtle }]}>{t("iot.metrics.zone.sensor")}</Text>
          <SensorSelector
            onChange={setSelectedSensor}
            readings={readings}
            value={selectedSensor}
          />
        </View>
        <View style={styles.selectorBlock}>
          <Text style={[styles.selectorLabel, { color: theme.subtle }]}>{t("iot.metrics.zone.range")}</Text>
          <RangeSelector onChange={setSelectedRange} value={selectedRange} />
        </View>
        <SensorChartCard
          chart={chartQuery.data}
          error={chartQuery.isError && !chartQuery.data}
          loading={chartQuery.isFetching}
          range={selectedRange}
        />
      </View>

      <DeviceChartsPanel deviceId={deviceId} />

      <DeviceMediaPanel deviceId={deviceId} deviceUid={device.deviceUid} deviceStatus={device.status} />

      <View style={styles.actions}>
        <IoTActionCard
          icon={<SlidersHorizontal color={theme.primary} size={20} />}
          title={t("iot.devices.detail.configAction")}
          description={t("iot.devices.detail.configActionDescription")}
          onPress={() =>
            router.push({
              pathname: "/iot/devices/[deviceId]/config",
              params: { deviceId },
            })
          }
        />
        <IoTActionCard
          icon={<BarChart3 color={theme.primary} size={20} />}
          title={t("iot.devices.detail.chartAction")}
          description={t("iot.devices.detail.chartActionDescription")}
          onPress={scrollToCharts}
        />
        <IoTActionCard
          icon={<Bell color={theme.primary} size={20} />}
          title={t("iot.devices.detail.alertAction")}
          description={t("iot.devices.detail.alertActionDescription")}
          onPress={() =>
            router.push({
              pathname: "/iot/alerts",
              params: { deviceId, status: "OPEN" },
            })
          }
        />
      </View>
      <DeviceActionsSheet
        deviceLabel={getDeviceLabel(device, t("iot.common.selectedDevice"))}
        onClose={() => setActionsVisible(false)}
        onEdit={() => {
          setActionsVisible(false);
          setEditVisible(true);
        }}
        onRelease={() => {
          setActionsVisible(false);
          setReleaseVisible(true);
        }}
        visible={actionsVisible}
      />
      <EditDeviceSheet
        device={device}
        isSubmitting={updateDeviceMutation.isPending}
        onClose={() => setEditVisible(false)}
        onSubmit={updateDevice}
        visible={editVisible}
      />
      <ReleaseDeviceConfirmDialog
        deviceLabel={getDeviceLabel(device, t("iot.common.selectedDevice"))}
        isSubmitting={releaseDeviceMutation.isPending}
        onCancel={() => setReleaseVisible(false)}
        onConfirm={releaseDevice}
        visible={releaseVisible}
      />
    </ScrollView>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  const theme = useIotTheme();

  return (
    <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
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
  manageButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  manageButtonText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },
  offlineGuideWrap: {
    marginTop: 16,
  },
  placeholderAction: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#bbf7d0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  placeholderActionPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  placeholderIcon: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
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
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
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
  selectorBlock: {
    gap: 8,
    marginBottom: 12,
  },
  selectorLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
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
