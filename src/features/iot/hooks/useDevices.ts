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
