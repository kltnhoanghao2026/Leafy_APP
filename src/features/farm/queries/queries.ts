import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { farmApi } from "../api/farm.api";
import { farmKeys } from "./keys";
import type { CreateFarmPlotRequest } from "../components/farm.types";

export const useFarmPlotsByOwner = (ownerProfileId: string) =>
  useQuery({
    queryKey: farmKeys.plotsByOwner(ownerProfileId),
    queryFn: () => farmApi.getPlotsByOwner(ownerProfileId),
    select: (res) => res.data.data,
    enabled: !!ownerProfileId,
  });

export const useFarmZonesByPlot = (plotId: string) =>
  useQuery({
    queryKey: farmKeys.zonesByPlot(plotId),
    queryFn: () => farmApi.getZonesByPlot(plotId),
    select: (res) => res.data.data,
    enabled: !!plotId,
  });

export const useFarmPlotById = (id: string) =>
  useQuery({
    queryKey: farmKeys.plot(id),
    queryFn: () => farmApi.getPlotById(id),
    select: (res) => res.data.data,
    enabled: !!id,
  });

export const useCreateFarmPlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFarmPlotRequest) => farmApi.createPlot(payload),
    onSuccess: () => {
      // Invalidate farm plots list to refetch
      queryClient.invalidateQueries({ queryKey: farmKeys.all() });
    },
  });
};
