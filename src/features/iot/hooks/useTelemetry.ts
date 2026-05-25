import { queryOptions, useQuery } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import type { ChartRange, SensorCode } from "../types";
import { iotKeys } from "./useDevices";

export const deviceChartQueryOptions = (
  deviceId?: string,
  sensorCode?: SensorCode,
  range?: ChartRange,
) =>
  queryOptions({
    queryKey: iotKeys.deviceChart(deviceId, sensorCode, range),
    queryFn: () =>
      collectorApi.getDeviceChart(deviceId as string, {
        sensorCode: sensorCode as SensorCode,
        range: range as ChartRange,
      }),
    enabled: Boolean(deviceId && sensorCode && range),
    staleTime: 60_000,
  });

export const zoneChartQueryOptions = (
  zoneId?: string,
  sensorCode?: SensorCode,
  range?: ChartRange,
) =>
  queryOptions({
    queryKey: iotKeys.zoneChart(zoneId, sensorCode, range),
    queryFn: () =>
      collectorApi.getZoneChart(zoneId as string, {
        sensorCode: sensorCode as SensorCode,
        range: range as ChartRange,
      }),
    enabled: Boolean(zoneId && sensorCode && range),
    staleTime: 60_000,
  });

export const deviceMetricsComparisonQueryOptions = (
  deviceId?: string,
  sensorCodes: SensorCode[] = [],
  range?: ChartRange,
) =>
  queryOptions({
    queryKey: iotKeys.deviceMetricsComparison(deviceId, sensorCodes, range),
    queryFn: async () => {
      const results = await Promise.allSettled(
        sensorCodes.map((sensorCode) =>
          collectorApi.getDeviceChart(deviceId as string, {
            sensorCode,
            range: range as ChartRange,
          }),
        ),
      );

      const fulfilled = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );

      if (fulfilled.length || results.length === 0) {
        return fulfilled;
      }

      throw results.find((result) => result.status === "rejected")?.reason;
    },
    enabled: Boolean(deviceId && range && sensorCodes.length),
    staleTime: 60_000,
  });

export const useDeviceChart = (
  deviceId?: string,
  sensorCode?: SensorCode,
  range?: ChartRange,
) => {
  return useQuery(deviceChartQueryOptions(deviceId, sensorCode, range));
};

export const useDeviceTelemetry = useDeviceChart;

export const useDeviceMetricsComparison = (
  deviceId?: string,
  sensorCodes: SensorCode[] = [],
  range?: ChartRange,
) => {
  return useQuery(deviceMetricsComparisonQueryOptions(deviceId, sensorCodes, range));
};

export const useZoneChart = (
  zoneId?: string,
  sensorCode?: SensorCode,
  range?: ChartRange,
) => {
  return useQuery(zoneChartQueryOptions(zoneId, sensorCode, range));
};
