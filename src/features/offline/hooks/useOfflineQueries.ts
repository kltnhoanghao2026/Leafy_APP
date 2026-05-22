import { useQuery } from '@tanstack/react-query';
import { 
  getOfflineFarmPlots, 
  getOfflineFarmZones, 
  getOfflinePlants, 
  getOfflineSpecies, 
  getOfflinePlantEvents,
  getOfflinePlantEventById,
  getOfflineAgricultureStats
} from '../services/offline-query.service';
import { getPendingCount } from '../services/sync-queue.service';
import type { PageParams, PlantFilterParams } from '@/src/features/plant';

export const offlineKeys = {
  all: ['offline'] as const,
  farms: () => [...offlineKeys.all, 'farms'] as const,
  farmZones: (plotId: string) => [...offlineKeys.farms(), plotId, 'zones'] as const,
  plants: (params: any) => [...offlineKeys.all, 'plants', params] as const,
  species: () => [...offlineKeys.all, 'species'] as const,
  plantEvents: (params: any) => [...offlineKeys.all, 'plantEvents', params] as const,
  plantEvent: (id: string) => [...offlineKeys.all, 'plantEvent', id] as const,
  stats: () => [...offlineKeys.all, 'stats'] as const,
  pendingCount: () => [...offlineKeys.all, 'pendingCount'] as const,
};

export const useOfflineFarms = (ownerProfileId?: string) => {
  return useQuery({
    queryKey: [...offlineKeys.farms(), ownerProfileId],
    queryFn: () => getOfflineFarmPlots(ownerProfileId),
  });
};

export const useOfflineFarmZones = (plotId: string) => {
  return useQuery({
    queryKey: offlineKeys.farmZones(plotId),
    queryFn: () => getOfflineFarmZones(plotId),
    enabled: !!plotId,
  });
};

export const useOfflinePlants = (params: PageParams & PlantFilterParams) => {
  return useQuery({
    queryKey: offlineKeys.plants(params),
    queryFn: () => getOfflinePlants(params),
  });
};


export const useOfflineSpecies = () => {
  return useQuery({
    queryKey: offlineKeys.species(),
    queryFn: () => getOfflineSpecies(),
  });
};

export const useOfflinePlantEvents = (params: { farmPlotId?: string; farmZoneId?: string; plantId?: string }) => {
  // Serialize params to a stable string key to avoid cache misses from new object references
  const stableKey = [params.farmPlotId ?? '', params.farmZoneId ?? '', params.plantId ?? ''].join('|');
  return useQuery({
    queryKey: [...offlineKeys.all, 'plantEvents', stableKey],
    queryFn: () => getOfflinePlantEvents(params),
    staleTime: 0, // Always refetch when invalidated
  });
};

export const useOfflinePlantEventById = (id: string) => {
  return useQuery({
    queryKey: offlineKeys.plantEvent(id),
    queryFn: () => getOfflinePlantEventById(id),
    enabled: !!id,
  });
};

export const useOfflineAgricultureStats = () => {
  return useQuery({
    queryKey: offlineKeys.stats(),
    queryFn: () => getOfflineAgricultureStats(),
  });
};

export const useOfflinePendingCount = () => {
  return useQuery({
    queryKey: offlineKeys.pendingCount(),
    queryFn: () => getPendingCount(),
    refetchInterval: 5000,
  });
};
