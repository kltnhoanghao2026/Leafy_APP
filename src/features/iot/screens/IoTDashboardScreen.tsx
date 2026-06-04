import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, RefreshCw } from "lucide-react-native";
import { useEffect, useState } from "react";
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

import { useFarmPlots, useFarmZones } from "@/src/features/farm";
import type { FarmPlotResponse, FarmZoneResponse } from "@/src/features/farm";
import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";

import { DashboardOverviewCard } from "../components/DashboardOverviewCard";
import { useIotTheme } from "../components/IoTUi";
import { useDashboardOverview } from "../hooks/useIotDashboard";

export function IoTDashboardScreen() {
  const { t } = useTranslation();
  const theme = useIotTheme();
  const router = useRouter();
  const profileQuery = useQuery(getMyProfileQueryOptions());
  const plotsQuery = useFarmPlots(profileQuery.data?.id);
  const [selectedPlotId, setSelectedPlotId] = useState<string | undefined>();
  const zonesQuery = useFarmZones(selectedPlotId);
  const overviewQuery = useDashboardOverview(selectedPlotId);

  useEffect(() => {
    if (!selectedPlotId && plotsQuery.data?.[0]) {
      setSelectedPlotId(plotsQuery.data[0].id);
    }
  }, [plotsQuery.data, selectedPlotId]);

  const selectedPlot = plotsQuery.data?.find((plot) => plot.id === selectedPlotId);
  const isRefreshing =
    profileQuery.isRefetching ||
    plotsQuery.isRefetching ||
    zonesQuery.isRefetching ||
    overviewQuery.isRefetching;

  const refresh = () => {
    profileQuery.refetch();
    plotsQuery.refetch();
    zonesQuery.refetch();
    overviewQuery.refetch();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl onRefresh={refresh} refreshing={isRefreshing} tintColor={theme.primary} />
      }
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.primary }]}>{t("iot.metrics.dashboard.kicker")}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{t("iot.metrics.dashboard.title")}</Text>
        <Text style={[styles.subtitle, { color: theme.subtle }]}>
          {t("iot.metrics.dashboard.description")}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{t("iot.metrics.dashboard.selectFarm")}</Text>
          {plotsQuery.isFetching ? <ActivityIndicator color={theme.primary} /> : null}
        </View>
        {profileQuery.isError || plotsQuery.isError ? (
          <ErrorText text={t("iot.metrics.dashboard.farmsLoadFailed")} />
        ) : null}
        {!plotsQuery.isLoading && !plotsQuery.data?.length ? (
          <Text style={[styles.hint, { color: theme.subtle }]}>{t("iot.metrics.dashboard.noFarms")}</Text>
        ) : null}
        <View style={styles.optionWrap}>
          {plotsQuery.data?.map((plot) => (
            <PlotOption
              active={selectedPlotId === plot.id}
              key={plot.id}
              onPress={() => setSelectedPlotId(plot.id)}
              plot={plot}
            />
          ))}
        </View>
      </View>

      {overviewQuery.isLoading ? (
        <LoadingBox text={t("iot.metrics.dashboard.loadingOverview")} />
      ) : overviewQuery.isError && !overviewQuery.data ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{t("iot.metrics.dashboard.overviewLoadFailed")}</Text>
          <Pressable style={styles.retryButton} onPress={() => overviewQuery.refetch()}>
            <RefreshCw color="#ffffff" size={16} />
            <Text style={styles.retryText}>{t("iot.common.retry")}</Text>
          </Pressable>
        </View>
      ) : selectedPlotId ? (
        <DashboardOverviewCard overview={overviewQuery.data} />
      ) : null}

      <Pressable
        style={[styles.alertShortcut, { backgroundColor: theme.dangerSoft, borderColor: theme.tone("danger").border }]}
        onPress={() =>
          router.push({
            pathname: "/iot/alerts",
            params: { status: "OPEN" },
          })
        }
      >
        <View style={styles.alertShortcutText}>
          <Text style={[styles.alertShortcutTitle, { color: theme.danger }]}>{t("iot.metrics.dashboard.openAlerts")}</Text>
          <Text style={[styles.alertShortcutMeta, { color: theme.danger }]}>
            {t("iot.metrics.dashboard.openAlertsCount", {
              count: overviewQuery.data?.openAlerts ?? 0,
            })}
          </Text>
        </View>
        <ChevronRight color={theme.danger} size={20} />
      </Pressable>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{t("iot.metrics.dashboard.farmZones")}</Text>
        {selectedPlot ? (
          <Text style={[styles.hint, { color: theme.subtle }]}>{t("iot.metrics.dashboard.selectedFarm", { farm: selectedPlot.name })}</Text>
        ) : null}
        {zonesQuery.isLoading ? <LoadingBox text={t("iot.metrics.dashboard.loadingZones")} /> : null}
        {zonesQuery.isError ? (
          <ErrorText text={t("iot.metrics.dashboard.zonesLoadFailed")} />
        ) : null}
        {selectedPlotId && !zonesQuery.isLoading && !zonesQuery.data?.length ? (
          <Text style={styles.hint}>{t("iot.metrics.dashboard.noZones")}</Text>
        ) : null}
        <View style={styles.zoneList}>
          {zonesQuery.data?.map((zone) => (
            <ZoneRow
              key={zone.id}
              onPress={() =>
                router.push({
                  pathname: "/iot/zones/[zoneId]",
                  params: { zoneId: zone.id, zoneName: zone.zoneName },
                })
              }
              zone={zone}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function PlotOption({
  plot,
  active,
  onPress,
}: {
  plot: FarmPlotResponse;
  active: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useIotTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        { backgroundColor: theme.cardAlt, borderColor: theme.border },
        active && { backgroundColor: theme.primarySoft, borderColor: theme.tone("primary").border },
      ]}
    >
      <Text style={[styles.optionTitle, { color: active ? theme.primary : theme.text }]}>
        {plot.name}
      </Text>
      <Text style={[styles.optionMeta, { color: active ? theme.primary : theme.subtle }]}>
        {plot.addressLine || t("iot.common.noFarmMetadata")}
      </Text>
    </Pressable>
  );
}

function ZoneRow({
  zone,
  onPress,
}: {
  zone: FarmZoneResponse;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useIotTheme();

  return (
    <Pressable onPress={onPress} style={[styles.zoneRow, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
      <View style={styles.zoneText}>
        <Text style={[styles.zoneTitle, { color: theme.text }]}>{zone.zoneName}</Text>
        <Text style={[styles.zoneMeta, { color: theme.subtle }]}>{zone.cropType || zone.soilType || t("iot.common.noZoneMetadata")}</Text>
      </View>
      <ChevronRight color={theme.primary} size={20} />
    </Pressable>
  );
}

function LoadingBox({ text }: { text: string }) {
  const theme = useIotTheme();

  return (
    <View style={styles.loadingBox}>
      <ActivityIndicator color={theme.primary} />
      <Text style={[styles.hint, { color: theme.subtle }]}>{text}</Text>
    </View>
  );
}

function ErrorText({ text }: { text: string }) {
  const theme = useIotTheme();

  return <Text style={[styles.errorInline, { color: theme.danger }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  alertShortcut: {
    alignItems: "center",
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 16,
  },
  alertShortcutMeta: {
    color: "#be123c",
    fontSize: 13,
    marginTop: 4,
  },
  alertShortcutText: {
    flex: 1,
  },
  alertShortcutTitle: {
    color: "#881337",
    fontSize: 16,
    fontWeight: "900",
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
    padding: 16,
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 17,
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
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  errorInline: {
    color: "#be123c",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
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
    marginTop: 8,
  },
  kicker: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  loadingBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
  },
  option: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  optionActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  optionMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  optionMetaActive: {
    color: "#15803d",
  },
  optionTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  optionTitleActive: {
    color: "#166534",
  },
  optionWrap: {
    gap: 8,
    marginTop: 12,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#be123c",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  zoneList: {
    gap: 10,
    marginTop: 12,
  },
  zoneMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  zoneRow: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 12,
  },
  zoneText: {
    flex: 1,
  },
  zoneTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
});
