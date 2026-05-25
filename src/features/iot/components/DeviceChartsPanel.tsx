import { BarChart3, Bell, Maximize2, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { useAlertEvents } from "../hooks/useAlerts";
import { useDeviceMedia } from "../hooks/useDeviceMedia";
import { useDeviceMetricsComparison } from "../hooks/useTelemetry";
import type {
  AlertEventItemResponse,
  ChartRange,
  DeviceMediaEvent,
  SensorChartResponse,
  SensorCode,
} from "../types";
import { getAlertTimeRange } from "../utils/alertLabels";
import {
  formatChartTimestamp,
  getPointTimestamp,
  getPointValue,
} from "../utils/chartFormat";
import { formatDateTime } from "../utils/deviceLabels";
import { getSensorLabel } from "../utils/sensorLabels";
import { RangeSelector } from "./RangeSelector";

const METRICS: SensorCode[] = [
  "AIR_TEMP",
  "AIR_HUMIDITY",
  "SOIL_MOISTURE",
  "LIGHT_INTENSITY",
];

const COLORS: Record<string, string> = {
  AIR_TEMP: "#ef4444",
  AIR_HUMIDITY: "#0ea5e9",
  SOIL_MOISTURE: "#16a34a",
  LIGHT_INTENSITY: "#eab308",
};

const chartWidth = 340;
const chartHeight = 210;
const padding = 30;

type ChartPoint = {
  sensorCode: string;
  value: number;
  timestamp: string;
  label: string;
  x: number;
  y: number;
};

type Marker = {
  id: string;
  timestamp: string;
  label: string;
  severity?: string | null;
  source: "alert" | "media";
  x: number;
};

type DeviceChartsPanelProps = {
  deviceId: string;
};

export function DeviceChartsPanel({ deviceId }: DeviceChartsPanelProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<ChartRange>("H24");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<SensorCode[]>([
    "AIR_TEMP",
    "AIR_HUMIDITY",
  ]);
  const [expanded, setExpanded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const metrics = compareMode ? selectedMetrics : [selectedMetrics[0] ?? "AIR_TEMP"];
  const chartsQuery = useDeviceMetricsComparison(deviceId, metrics, range);
  const mediaQuery = useDeviceMedia(deviceId);
  const alertRange = getAlertTimeRange(range === "H24" ? "H24" : range === "D30" || range === "D90" ? "D30" : "D7");
  const alertsQuery = useAlertEvents({
    deviceId,
    page: 0,
    size: 100,
    sortBy: "openedAt",
    sortDir: "desc",
    ...alertRange,
  });

  const charts = chartsQuery.data ?? [];
  const refreshing =
    chartsQuery.isRefetching || alertsQuery.isRefetching || mediaQuery.isRefetching;

  const toggleMetric = (metric: SensorCode) => {
    setSelectedMetrics((current) => {
      if (current.includes(metric)) {
        const next = current.filter((item) => item !== metric);
        return next.length ? next : [metric];
      }

      return [...current, metric].slice(0, 3);
    });
  };

  const refresh = () => {
    chartsQuery.refetch();
    alertsQuery.refetch();
    mediaQuery.refetch();
  };

  const body = (
    <ChartBody
      alerts={alertsQuery.data?.items ?? []}
      charts={charts}
      compareMode={compareMode}
      loading={chartsQuery.isLoading}
      mediaEvents={mediaQuery.data ?? []}
      range={range}
      selectedMarker={selectedMarker}
      onSelectMarker={setSelectedMarker}
    />
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <BarChart3 color="#166534" size={20} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t("iot.charts.title")}</Text>
          <Text style={styles.subtitle}>{t("iot.charts.description")}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.metricScroll}
      >
        {METRICS.map((metric) => {
          const selected = selectedMetrics.includes(metric);
          return (
            <Pressable
              key={metric}
              onPress={() => toggleMetric(metric)}
              style={[styles.metricChip, selected && styles.metricChipActive]}
            >
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: COLORS[metric] ?? "#64748b" },
                ]}
              />
              <Text style={[styles.metricLabel, selected && styles.metricLabelActive]}>
                {getSensorLabel(metric)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.controls}>
        <RangeSelector value={range} onChange={setRange} />
        <View style={styles.controlRow}>
          <Pressable
            onPress={() => setCompareMode((value) => !value)}
            style={[styles.toggleButton, compareMode && styles.toggleButtonActive]}
          >
            <Text
              style={[
                styles.toggleButtonText,
                compareMode && styles.toggleButtonTextActive,
              ]}
            >
              {t("iot.charts.compareMode")}
            </Text>
          </Pressable>
          <Pressable style={styles.expandButton} onPress={() => setExpanded(true)}>
            <Maximize2 color="#166534" size={16} />
            <Text style={styles.expandButtonText}>{t("iot.charts.expand")}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor="#15803d" onRefresh={refresh} />
        }
      >
        {chartsQuery.isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t("iot.charts.loadFailed")}</Text>
          </View>
        ) : (
          body
        )}
      </ScrollView>

      <Modal animationType="slide" visible={expanded} onRequestClose={() => setExpanded(false)}>
        <View style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>{t("iot.charts.expandedTitle")}</Text>
            <Pressable style={styles.closeButton} onPress={() => setExpanded(false)}>
              <X color="#0f172a" size={20} />
            </Pressable>
          </View>
          {body}
        </View>
      </Modal>
    </View>
  );
}

function ChartBody({
  charts,
  alerts,
  mediaEvents,
  compareMode,
  range,
  loading,
  selectedMarker,
  onSelectMarker,
}: {
  charts: SensorChartResponse[];
  alerts: AlertEventItemResponse[];
  mediaEvents: DeviceMediaEvent[];
  compareMode: boolean;
  range: ChartRange;
  loading?: boolean;
  selectedMarker: Marker | null;
  onSelectMarker: (marker: Marker | null) => void;
}) {
  const { t } = useTranslation();
  const series = useMemo(() => buildSeries(charts, range), [charts, range]);
  const allPoints = series.flatMap((item) => item.points);
  const values = allPoints.map((point) => point.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = Math.max(max - min, 1);

  const normalizedSeries = series.map((item) => ({
    ...item,
    points: item.points.map((point, index) => ({
      ...point,
      x: resolveX(index, item.points.length),
      y: resolveY(point.value, min, span),
    })),
  }));

  const markers = buildMarkers(alerts, mediaEvents, allPoints);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#15803d" />
        <Text style={styles.muted}>{t("iot.charts.loading")}</Text>
      </View>
    );
  }

  if (!allPoints.length) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>{t("iot.charts.emptyTitle")}</Text>
        <Text style={styles.muted}>{t("iot.charts.emptyDescription")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartCard}>
      <View style={styles.legend}>
        {normalizedSeries.map((item) => (
          <View key={item.sensorCode} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: COLORS[item.sensorCode] ?? "#64748b" },
              ]}
            />
            <Text style={styles.legendText}>{getSensorLabel(item.sensorCode)}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <Bell color="#be123c" size={12} />
          <Text style={styles.legendText}>{t("iot.charts.alertMarkers")}</Text>
        </View>
      </View>
      <View style={styles.chartBox}>
        <Svg height={chartHeight} width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Line
            stroke="#e2e8f0"
            strokeWidth="1"
            x1={padding}
            x2={chartWidth - padding}
            y1={chartHeight - padding}
            y2={chartHeight - padding}
          />
          <Line
            stroke="#e2e8f0"
            strokeWidth="1"
            x1={padding}
            x2={padding}
            y1={padding}
            y2={chartHeight - padding}
          />
          {normalizedSeries.map((item) => (
            <Polyline
              key={item.sensorCode}
              fill="none"
              points={item.points.map((point) => `${point.x},${point.y}`).join(" ")}
              stroke={COLORS[item.sensorCode] ?? "#64748b"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={compareMode ? "2.5" : "3"}
            />
          ))}
          {normalizedSeries.flatMap((item) =>
            item.points
              .filter((_point, index) => index === 0 || index === item.points.length - 1)
              .map((point) => (
                <Circle
                  cx={point.x}
                  cy={point.y}
                  fill="#ffffff"
                  key={`${item.sensorCode}-${point.timestamp}`}
                  r="4"
                  stroke={COLORS[item.sensorCode] ?? "#64748b"}
                  strokeWidth="2"
                />
              )),
          )}
          {markers.map((marker) => (
            <Circle
              cx={marker.x}
              cy={padding + 12}
              fill={marker.source === "alert" ? "#be123c" : "#f97316"}
              key={marker.id}
              onPress={() => onSelectMarker(marker)}
              r="5"
            />
          ))}
          {allPoints[0]?.label ? (
            <SvgText fill="#64748b" fontSize="10" x={padding} y={chartHeight - 8}>
              {allPoints[0].label}
            </SvgText>
          ) : null}
          {allPoints[allPoints.length - 1]?.label ? (
            <SvgText
              fill="#64748b"
              fontSize="10"
              textAnchor="end"
              x={chartWidth - padding}
              y={chartHeight - 8}
            >
              {allPoints[allPoints.length - 1].label}
            </SvgText>
          ) : null}
        </Svg>
      </View>
      {selectedMarker ? (
        <View style={styles.markerBox}>
          <Text style={styles.markerTitle}>{selectedMarker.label}</Text>
          <Text style={styles.markerText}>
            {t("iot.charts.markerTimestamp")}: {formatDateTime(selectedMarker.timestamp)}
          </Text>
          <Text style={styles.markerText}>
            {t("iot.charts.markerSeverity")}: {selectedMarker.severity ?? t("iot.common.unknown")}
          </Text>
          <Pressable onPress={() => onSelectMarker(null)}>
            <Text style={styles.markerDismiss}>{t("iot.charts.dismissMarker")}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const resolveX = (index: number, length: number) =>
  padding +
  (length === 1
    ? (chartWidth - padding * 2) / 2
    : (index / (length - 1)) * (chartWidth - padding * 2));

const resolveY = (value: number, min: number, span: number) =>
  chartHeight - padding - ((value - min) / span) * (chartHeight - padding * 2);

const buildSeries = (charts: SensorChartResponse[], range: ChartRange) =>
  charts.map((chart) => ({
    sensorCode: chart.sensorCode,
    points: chart.points
      .map((point) => {
        const value = getPointValue(point);
        const timestamp = getPointTimestamp(point);
        if (value === null || !timestamp) return null;
        return {
          sensorCode: chart.sensorCode,
          value,
          timestamp,
          label: formatChartTimestamp(timestamp, range),
          x: 0,
          y: 0,
        };
      })
      .filter((point): point is ChartPoint => Boolean(point)),
  }));

const buildMarkers = (
  alerts: AlertEventItemResponse[],
  mediaEvents: DeviceMediaEvent[],
  points: ChartPoint[],
): Marker[] => {
  const timestamps = points.map((point) => new Date(point.timestamp).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const span = Math.max(maxTime - minTime, 1);
  const resolveMarkerX = (timestamp: string) => {
    const time = new Date(timestamp).getTime();
    return padding + ((time - minTime) / span) * (chartWidth - padding * 2);
  };

  const alertMarkers = alerts.reduce<Marker[]>((acc, alert) => {
      const timestamp = alert.triggeredAt ?? alert.openedAt ?? alert.createdAt;
      if (!timestamp) return acc;
      acc.push({
        id: alert.id,
        timestamp,
        label: alert.message,
        severity: alert.severity,
        source: "alert" as const,
        x: resolveMarkerX(timestamp),
      });
      return acc;
    }, []);

  const mediaMarkers = mediaEvents
    .filter((media) => media.analysis?.alertEventId || media.analysis?.diseaseDetected)
    .reduce<Marker[]>((acc, media) => {
      const timestamp =
        media.analysis?.timestamp ??
        media.analysis?.analyzedAt ??
        media.uploadedAt ??
        media.timestamp ??
        media.requestedAt;
      if (!timestamp) return acc;
      acc.push({
        id: media.analysis?.alertEventId ?? media.id,
        timestamp,
        label: media.analysis?.diseaseType ?? media.analysis?.diseaseName ?? "Media analysis",
        severity: media.analysis?.severity,
        source: "media" as const,
        x: resolveMarkerX(timestamp),
      });
      return acc;
    }, []);

  return [...alertMarkers, ...mediaMarkers].filter(
    (marker) => Number.isFinite(marker.x) && marker.x >= padding && marker.x <= chartWidth - padding,
  );
};

const styles = StyleSheet.create({
  chartBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    overflow: "hidden",
    paddingTop: 6,
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  closeButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    padding: 10,
  },
  controlRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  controls: {
    gap: 10,
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    color: "#be123c",
    fontSize: 13,
    fontWeight: "800",
  },
  expandButton: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  expandButtonText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerText: {
    flex: 1,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  legendText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
  },
  loadingBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    padding: 16,
  },
  markerBox: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  markerDismiss: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
  },
  markerText: {
    color: "#9a3412",
    fontSize: 12,
    marginTop: 4,
  },
  markerTitle: {
    color: "#7c2d12",
    fontSize: 13,
    fontWeight: "900",
  },
  metricChip: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metricChipActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  metricLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  metricLabelActive: {
    color: "#166534",
  },
  metricScroll: {
    marginBottom: 12,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalScreen: {
    backgroundColor: "#f8fafc",
    flex: 1,
    padding: 18,
    paddingTop: 54,
  },
  muted: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    marginTop: 22,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
  toggleButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#e0f2fe",
  },
  toggleButtonText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
  },
  toggleButtonTextActive: {
    color: "#0369a1",
  },
});
