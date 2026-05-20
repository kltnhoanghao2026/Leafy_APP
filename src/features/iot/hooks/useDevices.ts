import { queryOptions, useQuery } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import type { MyDevicesParams } from "../types";

export const iotKeys = {
  all: ["iot"] as const,
  devices: (params?: MyDevicesParams) => [...iotKeys.all, "devices", params] as const,
  deviceDetail: (deviceId?: string) =>
    [...iotKeys.all, "devices", deviceId, "detail"] as const,
  latestReadings: (deviceId?: string) =>
    [...iotKeys.all, "devices", deviceId, "latest-readings"] as const,
  deviceChart: (deviceId?: string, sensorCode?: string, range?: string) =>
    [...iotKeys.all, "devices", deviceId, "charts", sensorCode, range] as const,
  deviceMetricsComparison: (
    deviceId?: string,
    sensorCodes?: readonly string[],
    range?: string,
  ) =>
    [...iotKeys.all, "devices", deviceId, "charts", "compare", sensorCodes, range] as const,
  dashboardOverview: (farmPlotId?: string) =>
    [...iotKeys.all, "dashboard-overview", farmPlotId] as const,
  zoneOverview: (zoneId?: string) =>
    [...iotKeys.all, "zones", zoneId, "overview"] as const,
  zoneChart: (zoneId?: string, sensorCode?: string, range?: string) =>
    [...iotKeys.all, "zones", zoneId, "charts", sensorCode, range] as const,
  deviceConfig: (deviceId?: string) =>
    [...iotKeys.all, "devices", deviceId, "config"] as const,
  deviceMedia: (deviceId?: string) =>
    [...iotKeys.all, "devices", deviceId, "media"] as const,
  deviceCameraSchedules: (deviceUid?: string) =>
    [...iotKeys.all, "devices", deviceUid, "camera-schedules"] as const,
  deviceCameraSchedule: (scheduleId?: string) =>
    [...iotKeys.all, "camera-schedules", scheduleId] as const,
  alerts: (params?: unknown) =>
    params ? ([...iotKeys.all, "alerts", params] as const) : ([...iotKeys.all, "alerts"] as const),
  alertDetail: (alertId?: string) =>
    [...iotKeys.all, "alerts", alertId, "detail"] as const,
  alertRules: () => [...iotKeys.all, "alert-rules"] as const,
  alertRule: (ruleId?: string) =>
    [...iotKeys.all, "alert-rules", ruleId] as const,
};

export const myDevicesQueryOptions = (params?: MyDevicesParams) =>
  queryOptions({
    queryKey: iotKeys.devices(params),
    queryFn: () => collectorApi.getMyDevices(params),
    staleTime: 30_000,
  });

export const useMyDevices = (params?: MyDevicesParams) => {
  return useQuery(myDevicesQueryOptions(params));
};
