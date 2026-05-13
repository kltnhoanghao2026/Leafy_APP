import { useQuery } from '@tanstack/react-query';
import { 
  getOfflineFarmPlots, 
  getOfflineFarmZones, 
  getOfflinePlants, 
  getOfflineSpecies, 
  getOfflinePlantEvents 
} from '../services/offline-query.service';
import type {  PageParams } from '@/src/features/plant';

export const offlineKeys = {
  all: ['offline'] as const,
  farms: () => [...offlineKeys.all, 'farms'] as const,
  farmZones: (plotId: string) => [...offlineKeys.farms(), plotId, 'zones'] as const,
  plants: (params: any) => [...offlineKeys.all, 'plants', params] as const,
  species: () => [...offlineKeys.all, 'species'] as const,
  plantEvents: (params: any) => [...offlineKeys.all, 'plantEvents', params] as const,
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

export const useOfflinePlants = (params: PlantFilterParams & PageParams) => {
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
  return useQuery({
    queryKey: offlineKeys.plantEvents(params),
    queryFn: () => getOfflinePlantEvents(params),
  });
};
