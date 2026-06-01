import { queryOptions, useQuery } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import { withMediaDisplay } from "../utils/iotDisplay";
import { iotKeys } from "./useDevices";

export const deviceDetailQueryOptions = (deviceId?: string) =>
  queryOptions({
    queryKey: iotKeys.deviceDetail(deviceId),
    queryFn: () => collectorApi.getDeviceDetail(deviceId as string),
    enabled: Boolean(deviceId),
    staleTime: 30_000,
  });

export const latestReadingsQueryOptions = (deviceId?: string) =>
  queryOptions({
    queryKey: iotKeys.latestReadings(deviceId),
    queryFn: () => collectorApi.getDeviceLatestReadings(deviceId as string),
    enabled: Boolean(deviceId),
    staleTime: 15_000,
  });

export const useDeviceDetail = (deviceId?: string) => {
  return useQuery({
    ...deviceDetailQueryOptions(deviceId),
    select: (detail) => ({
      ...detail,
      latestMedia: detail.latestMedia ? withMediaDisplay(detail.latestMedia) : detail.latestMedia,
    }),
  });
};

export const useDeviceLatestReadings = (deviceId?: string) => {
  return useQuery(latestReadingsQueryOptions(deviceId));
};
