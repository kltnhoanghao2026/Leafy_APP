import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import type { ChartRange, SensorChartResponse } from "../types";
import {
  getSensorDisplay,
  normalizeChartPoints,
} from "../utils/chartFormat";
import { ChartEmptyState } from "./ChartEmptyState";

type SensorChartCardProps = {
  chart?: SensorChartResponse;
  range: ChartRange;
  loading?: boolean;
  error?: boolean;
};

const chartWidth = 320;
const chartHeight = 170;
const padding = 28;

export function SensorChartCard({
  chart,
  range,
  loading,
  error,
}: SensorChartCardProps) {
  const points = normalizeChartPoints(chart?.points ?? [], range);
  const latest = points.length ? points[points.length - 1] : undefined;
  const values = points.map((point) => point.value);
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const span = min !== null && max !== null ? Math.max(max - min, 1) : 1;
  const unit = chart?.unit ? ` ${chart.unit}` : "";

  const svgPoints = points
    .map((point, index) => {
      const x =
        padding +
        (points.length === 1
          ? (chartWidth - padding * 2) / 2
          : (index / (points.length - 1)) * (chartWidth - padding * 2));
      const y =
        chartHeight -
        padding -
        ((point.value - (min ?? 0)) / span) * (chartHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {chart
              ? getSensorDisplay(chart.sensorCode, chart.sensorName, chart.unit)
              : "Biểu đồ cảm biến"}
          </Text>
          <Text style={styles.subtitle}>Range: {range}</Text>
        </View>
        {loading ? <ActivityIndicator color="#15803d" /> : null}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Không tải được biểu đồ. Kéo để thử lại.</Text>
        </View>
      ) : null}

      {!loading && !error && !points.length ? <ChartEmptyState /> : null}

      {!error && points.length ? (
        <>
          <View style={styles.summaryRow}>
            <Summary label="Mới nhất" value={latest ? `${latest.value.toFixed(1)}${unit}` : "-"} />
            <Summary label="Thấp nhất" value={min !== null ? `${min.toFixed(1)}${unit}` : "-"} />
            <Summary label="Cao nhất" value={max !== null ? `${max.toFixed(1)}${unit}` : "-"} />
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
              <Polyline
                fill="none"
                points={svgPoints}
                stroke="#16a34a"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              {points.map((point, index) => {
                const x =
                  padding +
                  (points.length === 1
                    ? (chartWidth - padding * 2) / 2
                    : (index / (points.length - 1)) * (chartWidth - padding * 2));
                const y =
                  chartHeight -
                  padding -
                  ((point.value - (min ?? 0)) / span) * (chartHeight - padding * 2);
                if (index !== points.length - 1 && index !== 0) {
                  return null;
                }

                return (
                  <Circle
                    cx={x}
                    cy={y}
                    fill="#ffffff"
                    key={`${point.label}-${index}`}
                    r="4"
                    stroke="#16a34a"
                    strokeWidth="2"
                  />
                );
              })}
              {points[0]?.label ? (
                <SvgText fill="#64748b" fontSize="10" x={padding} y={chartHeight - 8}>
                  {points[0].label}
                </SvgText>
              ) : null}
              {latest?.label ? (
                <SvgText
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  x={chartWidth - padding}
                  y={chartHeight - 8}
                >
                  {latest.label}
                </SvgText>
              ) : null}
            </Svg>
          </View>
        </>
      ) : null}
    </View>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  chartBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    overflow: "hidden",
    paddingTop: 6,
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    color: "#be123c",
    fontSize: 13,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    paddingRight: 10,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },
  summary: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    flex: 1,
    padding: 10,
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  title: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
});
