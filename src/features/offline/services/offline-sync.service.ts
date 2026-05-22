import { farmApi } from '@/src/features/farm';
import { plantApi } from '@/src/features/plant';
import { plantEventApi } from '@/src/features/plant-event';
import {
  cacheFarmPlots,
  cacheFarmZones,
  cacheSpecies,
  cachePlants,
  cachePlantEvents,
} from './offline-cache.service';
import { getDbAsync } from './offline-database';
import type { FarmPlotResponse } from '@/src/features/farm';

export type SyncTableKey = 'farm_plots' | 'farm_zones' | 'species' | 'plants' | 'plant_events';

export type SyncTableStatus = 'idle' | 'syncing' | 'done' | 'error';

export interface SyncTableResult {
  status: SyncTableStatus;
  count: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  durationMs: number;
  tables: Record<SyncTableKey, SyncTableResult>;
  totalCount: number;
}

export type SyncProgressCallback = (
  table: SyncTableKey,
  status: SyncTableStatus,
  count?: number,
  error?: string
) => void;

/**
 * Sync farm plots and their zones for a given profile.
 */
export const syncFarmData = async (
  profileId: string,
  onProgress?: SyncProgressCallback
): Promise<{ plots: FarmPlotResponse[]; plotCount: number; zoneCount: number }> => {
  onProgress?.('farm_plots', 'syncing');

  let plots: FarmPlotResponse[] = [];
  let zoneCount = 0;

  try {
    const plotRes = await farmApi.getPlotsByOwner(profileId);
    plots = plotRes.data.data ?? [];

    if (plots.length > 0) {
      await cacheFarmPlots(plots);
    }

    // Fetch zones for all plots
    onProgress?.('farm_zones', 'syncing');
    for (const plot of plots) {
      try {
        const zoneRes = await farmApi.getZonesByPlot(plot.id);
        const zones = zoneRes.data.data ?? [];
        if (zones.length > 0) {
          await cacheFarmZones(zones);
          zoneCount += zones.length;
        }
      } catch (zoneErr) {
        console.warn(`[SyncService] Failed to fetch zones for plot ${plot.id}`, zoneErr);
      }
    }

    onProgress?.('farm_plots', 'done', plots.length);
    onProgress?.('farm_zones', 'done', zoneCount);

    return { plots, plotCount: plots.length, zoneCount };
  } catch (err: any) {
    const msg = err?.message ?? 'Failed to sync farm data';
    onProgress?.('farm_plots', 'error', 0, msg);
    onProgress?.('farm_zones', 'error', 0, msg);
    throw err;
  }
};

/**
 * Sync species (all, paginated).
 */
export const syncSpeciesData = async (
  onProgress?: SyncProgressCallback
): Promise<number> => {
  onProgress?.('species', 'syncing');
  let total = 0;
  let page = 0;
  const size = 100;

  try {
    const db = await getDbAsync();
    await db.runAsync('DELETE FROM species');

    while (true) {
      const res = await plantApi.getSpecies({ page, size, sortBy: 'commonName', sortDir: 'ASC' });
      const data = res.data.data;
      const items = data?.content ?? [];

      if (items.length > 0) {
        await cacheSpecies(items);
        total += items.length;
      }

      if (data?.last || items.length === 0) break;
      page++;
    }

    onProgress?.('species', 'done', total);
    return total;
  } catch (err: any) {
    const msg = err?.message ?? 'Failed to sync species';
    onProgress?.('species', 'error', 0, msg);
    throw err;
  }
};

/**
 * Sync user's own plants (paginated via /plants/me).
 */
export const syncPlantData = async (
  onProgress?: SyncProgressCallback
): Promise<number> => {
  onProgress?.('plants', 'syncing');
  let total = 0;
  let page = 0;
  const size = 100;

  try {
    while (true) {
      const res = await plantApi.getPlants({ page, size, sortBy: 'createdAt', sortDir: 'DESC' });
      const data = res.data.data;
      const items = data?.content ?? [];

      if (items.length > 0) {
        await cachePlants(items);
        total += items.length;
      }

      if (data?.last || items.length === 0) break;
      page++;
    }

    onProgress?.('plants', 'done', total);
    return total;
  } catch (err: any) {
    const msg = err?.message ?? 'Failed to sync plants';
    onProgress?.('plants', 'error', 0, msg);
    throw err;
  }
};

/**
 * Get ISO date strings for the first and last day of the current month.
 */
const getCurrentMonthRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return { startDate: fmt(start), endDate: fmt(end) };
};

/**
 * Sync plant events for the current month using the calendar endpoint scoped to the user's profileId.
 */
export const syncPlantEventsData = async (
  profileId: string,
  onProgress?: SyncProgressCallback
): Promise<number> => {
  onProgress?.('plant_events', 'syncing');

  const { startDate, endDate } = getCurrentMonthRange();

  try {
    const res = await plantEventApi.getEventsForCalendar({
      profileId,
      startDate,
      endDate,
    });

    const events = res.data.data ?? [];

    if (events.length > 0) {
      await cachePlantEvents(events);
    }

    onProgress?.('plant_events', 'done', events.length);
    return events.length;
  } catch (err: any) {
    const msg = err?.message ?? 'Failed to sync plant events';
    onProgress?.('plant_events', 'error', 0, msg);
    throw err;
  }
};

/**
 * Master sync: orchestrates all sync operations in sequence.
 */
export const syncAll = async (
  profileId: string,
  onProgress?: SyncProgressCallback
): Promise<SyncResult> => {
  const startTime = Date.now();

  const tables: Record<SyncTableKey, SyncTableResult> = {
    farm_plots: { status: 'idle', count: 0 },
    farm_zones: { status: 'idle', count: 0 },
    species: { status: 'idle', count: 0 },
    plants: { status: 'idle', count: 0 },
    plant_events: { status: 'idle', count: 0 },
  };

  const trackProgress: SyncProgressCallback = (table, status, count = 0, error) => {
    tables[table] = { status, count, error };
    onProgress?.(table, status, count, error);
  };

  let success = true;

  // 1. Farm data (plots + zones)
  try {
    const { plotCount, zoneCount } = await syncFarmData(profileId, trackProgress);
    tables.farm_plots = { status: 'done', count: plotCount };
    tables.farm_zones = { status: 'done', count: zoneCount };
  } catch {
    success = false;
  }

  // 2. Species
  try {
    const count = await syncSpeciesData(trackProgress);
    tables.species = { status: 'done', count };
  } catch {
    success = false;
  }

  // 3. Plants (own via /plants/me)
  try {
    const count = await syncPlantData(trackProgress);
    tables.plants = { status: 'done', count };
  } catch {
    success = false;
  }

  // 4. Plant events (current month, scoped to profileId)
  try {
    const count = await syncPlantEventsData(profileId, trackProgress);
    tables.plant_events = { status: 'done', count };
  } catch {
    success = false;
  }

  const durationMs = Date.now() - startTime;
  const totalCount = Object.values(tables).reduce((sum, t) => sum + t.count, 0);

  return { success, durationMs, tables, totalCount };
};
