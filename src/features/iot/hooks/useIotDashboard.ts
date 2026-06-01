import { queryOptions, useQuery } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import { withMediaDisplay } from "../utils/iotDisplay";
import { iotKeys } from "./useDevices";

export const dashboardOverviewQueryOptions = (farmPlotId?: string) =>
  queryOptions({
    queryKey: iotKeys.dashboardOverview(farmPlotId),
    queryFn: () => collectorApi.getDashboardOverview(farmPlotId as string),
    enabled: Boolean(farmPlotId),
    staleTime: 30_000,
  });

export const zoneOverviewQueryOptions = (zoneId?: string) =>
  queryOptions({
    queryKey: iotKeys.zoneOverview(zoneId),
    queryFn: () => collectorApi.getZoneOverview(zoneId as string),
    enabled: Boolean(zoneId),
    staleTime: 30_000,
  });

export const useDashboardOverview = (farmPlotId?: string) => {
  return useQuery(dashboardOverviewQueryOptions(farmPlotId));
};

export const useZoneOverview = (zoneId?: string) => {
  return useQuery({
    ...zoneOverviewQueryOptions(zoneId),
    select: (overview) => ({
      ...overview,
      latestMedia: overview.latestMedia ? withMediaDisplay(overview.latestMedia) : overview.latestMedia,
    }),
  });
};
