import { useMutation, useQueryClient } from "@tanstack/react-query";
import { farmApi } from "../api/farm.api";
import { farmKeys } from "./keys";
import type {
  CreateFarmPlotRequest,
  UpdateFarmPlotRequest,
  CreateFarmZoneRequest,
  UpdateFarmZoneRequest,
} from "../components/farm.types";

export const useCreatePlotMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFarmPlotRequest) => farmApi.createPlot(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.plots() });
    },
  });
};

export const useUpdatePlotMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFarmPlotRequest }) =>
      farmApi.updatePlot(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.plots() });
    },
  });
};

export const useDeletePlotMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => farmApi.deletePlot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.plots() });
    },
  });
};

export const useCreateZoneMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      plotId,
      body,
    }: {
      plotId: string;
      body: CreateFarmZoneRequest;
    }) => farmApi.createZone(plotId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.zones() });
    },
  });
};

export const useUpdateZoneMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFarmZoneRequest }) =>
      farmApi.updateZone(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.zones() });
    },
  });
};

export const useDeleteZoneMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => farmApi.deleteZone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: farmKeys.zones() });
    },
  });
};
