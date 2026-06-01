import type {
  ChartRange,
  SensorChartPointResponse,
  SensorCode,
} from "../types";
import { getSensorLabel, getSensorUnit } from "./sensorLabels";

export const DEFAULT_SENSOR_CODES: SensorCode[] = [
  "AIR_TEMP",
  "AIR_HUMIDITY",
  "SOIL_MOISTURE",
  "LIGHT_INTENSITY",
];

export const CHART_RANGES: Array<{ value: ChartRange; label: string }> = [
  { value: "H1", label: "1 giờ" },
  { value: "H24", label: "1 ngày" },
  { value: "D7", label: "7 ngày" },
  { value: "D30", label: "1 tháng" },
];

export type NormalizedChartPoint = {
  label: string;
  value: number;
  minValue?: number | null;
  maxValue?: number | null;
  sampleCount?: number | null;
};

export const getPointTimestamp = (point: SensorChartPointResponse): string | null => {
  return point.bucketStart ?? point.timestamp ?? null;
};

export const getPointValue = (point: SensorChartPointResponse): number | null => {
  const value = point.avgValue ?? point.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export const formatChartTimestamp = (
  timestamp?: string | null,
  range: ChartRange = "H24",
): string => {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  if (range === "H1" || range === "H24") {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (range === "D7") {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

export const normalizeChartPoints = (
  points: SensorChartPointResponse[] = [],
  range: ChartRange,
): NormalizedChartPoint[] => {
  return points.reduce<NormalizedChartPoint[]>((acc, point) => {
    const value = getPointValue(point);
    if (value === null) {
      return acc;
    }

    acc.push({
        label: formatChartTimestamp(getPointTimestamp(point), range),
        value,
        minValue: point.minValue,
        maxValue: point.maxValue,
        sampleCount: point.sampleCount,
    });

    return acc;
  }, []);
};

export const getSensorDisplay = (
  sensorCode: SensorCode,
  sensorName?: string | null,
  unit?: string | null,
): string => {
  const sensorLabel = getSensorLabel(sensorCode, sensorName);
  const sensorUnit = getSensorUnit(sensorCode, unit);
  return sensorUnit ? `${sensorLabel} (${sensorUnit})` : sensorLabel;
};
