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
  dashboardOverview: (farmPlotId?: string) =>
    [...iotKeys.all, "dashboard-overview", farmPlotId] as const,
  zoneOverview: (zoneId?: string) =>
    [...iotKeys.all, "zones", zoneId, "overview"] as const,
  zoneChart: (zoneId?: string, sensorCode?: string, range?: string) =>
    [...iotKeys.all, "zones", zoneId, "charts", sensorCode, range] as const,
  deviceConfig: (deviceId?: string) =>
    [...iotKeys.all, "devices", deviceId, "config"] as const,
  alerts: (params?: unknown) => [...iotKeys.all, "alerts", params] as const,
  alertDetail: (alertId?: string) =>
    [...iotKeys.all, "alerts", alertId, "detail"] as const,
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
