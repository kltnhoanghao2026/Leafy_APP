import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/src/features/auth';
import {
  createOfflinePlant, updateOfflinePlant, deleteOfflinePlant,
  createOfflineFarmPlot, updateOfflineFarmPlot, deleteOfflineFarmPlot,
  createOfflineFarmZone, updateOfflineFarmZone, deleteOfflineFarmZone,
  createOfflinePlantEvent, updateOfflinePlantEvent, deleteOfflinePlantEvent,
  toggleOfflinePlantEventCompleted,
} from '../services/offline-query.service';
import { offlineKeys } from './useOfflineQueries';
import type { PlantCreateRequest, PlantUpdateRequest } from '@/src/features/plant';
import type { CreateFarmPlotRequest, UpdateFarmPlotRequest, CreateFarmZoneRequest, UpdateFarmZoneRequest } from '@/src/features/farm';
import type { PlantEventCreateRequest, PlantEventUpdateRequest } from '@/src/features/plant-event';

// ── Plants ────────────────────────────────────────────────────────────────────

export const useOfflineCreatePlant = () => {
  const queryClient = useQueryClient();
  const { profileId } = useAuthContext();
  return useMutation({
    mutationFn: (data: PlantCreateRequest) =>
      createOfflinePlant({ ...data, ownerProfileId: profileId ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.plants({}) });
    },
  });
};

export const useOfflineUpdatePlant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PlantUpdateRequest }) =>
      updateOfflinePlant(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.plants({}) });
    },
  });
};

export const useOfflineDeletePlant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOfflinePlant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.plants({}) });
    },
  });
};

// ── Farm Plots ────────────────────────────────────────────────────────────────

export const useOfflineCreateFarmPlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFarmPlotRequest) => createOfflineFarmPlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.farms() });
    },
  });
};

export const useOfflineUpdateFarmPlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateFarmPlotRequest }) =>
      updateOfflineFarmPlot(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.farms() });
    },
  });
};

export const useOfflineDeleteFarmPlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOfflineFarmPlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.farms() });
    },
  });
};

// ── Farm Zones ────────────────────────────────────────────────────────────────

export const useOfflineCreateFarmZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ farmPlotId, data }: { farmPlotId: string; data: CreateFarmZoneRequest }) =>
      createOfflineFarmZone(farmPlotId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.farmZones(vars.farmPlotId) });
    },
  });
};

export const useOfflineUpdateFarmZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmPlotId, updates }: { id: string; farmPlotId: string; updates: UpdateFarmZoneRequest }) =>
      updateOfflineFarmZone(id, updates),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.farmZones(vars.farmPlotId) });
    },
  });
};

export const useOfflineDeleteFarmZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmPlotId }: { id: string; farmPlotId: string }) =>
      deleteOfflineFarmZone(id),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: offlineKeys.farmZones(vars.farmPlotId) });
    },
  });
};

// ── Plant Events ──────────────────────────────────────────────────────────────

export const useOfflineCreatePlantEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlantEventCreateRequest) => createOfflinePlantEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offline', 'plantEvents'] });
      queryClient.invalidateQueries({ queryKey: offlineKeys.stats() });
    },
  });
};

export const useOfflineUpdatePlantEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PlantEventUpdateRequest }) =>
      updateOfflinePlantEvent(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offline', 'plantEvents'] });
      queryClient.invalidateQueries({ queryKey: offlineKeys.stats() });
    },
  });
};

export const useOfflineDeletePlantEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOfflinePlantEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offline', 'plantEvents'] });
      queryClient.invalidateQueries({ queryKey: offlineKeys.stats() });
    },
  });
};

export const useOfflineTogglePlantEventCompleted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleOfflinePlantEventCompleted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offline', 'plantEvents'] });
      queryClient.invalidateQueries({ queryKey: offlineKeys.stats() });
    },
  });
};
