import { queryOptions, useQuery } from "@tanstack/react-query";

import { farmApi } from "../api/farm.api";
import { farmKeys } from "./useFarmPlots";

export const farmZonesQueryOptions = (plotId?: string) =>
  queryOptions({
    queryKey: farmKeys.zones(plotId),
    queryFn: () => farmApi.getZonesByPlot(plotId as string),
    select: (res) => res.data.data,
    enabled: Boolean(plotId),
    staleTime: 60_000,
  });

export const useFarmZones = (plotId?: string) => {
  return useQuery(farmZonesQueryOptions(plotId));
};
