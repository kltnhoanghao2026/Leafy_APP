import { queryOptions, useQuery } from "@tanstack/react-query";

import { farmApi } from "../api/farm.api";

export const farmKeys = {
  all: ["farms"] as const,
  plots: (ownerProfileId?: string) =>
    [...farmKeys.all, "plots", ownerProfileId] as const,
  zones: (plotId?: string) => [...farmKeys.all, "plots", plotId, "zones"] as const,
};

export const farmPlotsQueryOptions = (ownerProfileId?: string) =>
  queryOptions({
    queryKey: farmKeys.plots(ownerProfileId),
    queryFn: () => farmApi.getPlotsByOwner(ownerProfileId as string),
    enabled: Boolean(ownerProfileId),
    staleTime: 60_000,
  });

export const useFarmPlots = (ownerProfileId?: string) => {
  return useQuery(farmPlotsQueryOptions(ownerProfileId));
};
