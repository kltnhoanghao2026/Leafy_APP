import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  cacheFarmPlots,
  cacheFarmZones,
  cachePlants,
  cacheSpecies,
  cachePlantEvents,
} from '../services/offline-cache.service';
import type { FarmPlotResponse, FarmZoneResponse } from '@/src/features/farm';
import type { PlantResponse, SpeciesResponse, PageResponse } from '@/src/features/plant';
import type { PlantEventResponse } from '@/src/features/plant-event';
import type { ApiResponse } from '@/src/shared/api';

/**
 * Passive cache sync — listens to react-query cache updates and
 * automatically persists successful API responses into SQLite.
 * This keeps the offline database warm without any explicit user action.
 */
export const useOfflineCacheSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Only process successful queries
      if (event.type !== 'updated' || event.action.type !== 'success') {
        return;
      }

      const queryKey = event.query.queryKey;
      const data = event.action.data as ApiResponse<any>;

      if (!data || !data.data) return;

      try {
        // Match query keys to determine what to cache
        const [namespace, type] = queryKey as string[];

        // Farm cache
        if (namespace === 'farm') {
          if (type === 'plots' && Array.isArray(data.data)) {
            cacheFarmPlots(data.data as FarmPlotResponse[]);
          } else if (type === 'zones' && Array.isArray(data.data)) {
            cacheFarmZones(data.data as FarmZoneResponse[]);
          }
        }

        // Plant cache
        else if (namespace === 'plant') {
          if (type === 'list' || type === 'by_plot') {
            const pageData = data.data as PageResponse<PlantResponse>;
            if (pageData.content && Array.isArray(pageData.content)) {
              cachePlants(pageData.content);
            }
          } else if (type === 'species') {
            const pageData = data.data as PageResponse<SpeciesResponse>;
            if (pageData.content && Array.isArray(pageData.content)) {
              cacheSpecies(pageData.content);
            }
          }
        }

        // Plant Event cache
        else if (namespace === 'plantEvent') {
          if (Array.isArray(data.data)) {
            cachePlantEvents(data.data as PlantEventResponse[]);
          }
        }
      } catch (error) {
        console.error('[OfflineCacheSync] Error caching data:', error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);
};
