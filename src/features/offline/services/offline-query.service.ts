import { getDbAsync } from './offline-database';
import { Platform } from 'react-native';
import type { FarmPlotResponse, FarmZoneResponse } from '@/src/features/farm';
import type { PlantResponse, SpeciesResponse, PageResponse } from '@/src/features/plant';
import type { PlantEventResponse } from '@/src/features/plant-event';

export const getOfflineFarmPlots = async (ownerProfileId?: string): Promise<FarmPlotResponse[]> => {
  if (Platform.OS === 'web') return [];
  const db = await getDbAsync();
  try {
    let query = `SELECT * FROM farm_plots WHERE _deleted = 0`;
    const params: any[] = [];
    if (ownerProfileId) {
      query += ` AND ownerProfileId = ?`;
      params.push(ownerProfileId);
    }
    const rows = await db.getAllAsync(query, params) as any[];
    return rows.map(row => ({
      ...row,
      boundaryGeojson: row.boundaryGeojson ? JSON.parse(row.boundaryGeojson) : null,
    })) as FarmPlotResponse[];
  } catch (error) {
    console.error('[OfflineQuery] getOfflineFarmPlots failed', error);
    return [];
  }
};

export const getOfflineFarmZones = async (farmPlotId: string): Promise<FarmZoneResponse[]> => {
  if (Platform.OS === 'web') return [];
  const db = await getDbAsync();
  try {
    const rows = await db.getAllAsync(
      `SELECT * FROM farm_zones WHERE farmPlotId = ? AND _deleted = 0`,
      [farmPlotId]
    ) as any[];
    return rows.map(row => ({
      ...row,
      boundaryGeojson: row.boundaryGeojson ? JSON.parse(row.boundaryGeojson) : null,
    })) as FarmZoneResponse[];
  } catch (error) {
    console.error('[OfflineQuery] getOfflineFarmZones failed', error);
    return [];
  }
};

export const getOfflineSpecies = async (): Promise<SpeciesResponse[]> => {
  if (Platform.OS === 'web') return [];
  const db = await getDbAsync();
  try {
    const rows = await db.getAllAsync(`SELECT * FROM species WHERE _deleted = 0`) as any[];
    return rows.map(row => ({
      ...row,
      idealEnv: row.idealEnv ? JSON.parse(row.idealEnv) : null,
      commonDiseaseIds: row.commonDiseaseIds ? JSON.parse(row.commonDiseaseIds) : null,
    })) as SpeciesResponse[];
  } catch (error) {
    console.error('[OfflineQuery] getOfflineSpecies failed', error);
    return [];
  }
};

export const getOfflinePlants = async (params: { 
  farmPlotId?: string; 
  status?: string; 
  speciesId?: string; 
  page?: number; 
  size?: number;
}): Promise<PageResponse<PlantResponse>> => {
  if (Platform.OS === 'web') return { content: [], number: 0, size: 0, totalElements: 0, totalPages: 0, numberOfElements: 0, first: true, last: true, empty: true };
  const db = await getDbAsync();
  try {
    let query = `SELECT * FROM plants WHERE _deleted = 0`;
    let countQuery = `SELECT COUNT(*) as count FROM plants WHERE _deleted = 0`;
    const queryParams: any[] = [];
    
    if (params.farmPlotId) {
      query += ` AND farmPlotId = ?`;
      countQuery += ` AND farmPlotId = ?`;
      queryParams.push(params.farmPlotId);
    }
    if (params.status) {
      query += ` AND plantStatus = ?`;
      countQuery += ` AND plantStatus = ?`;
      queryParams.push(params.status);
    }
    if (params.speciesId) {
      query += ` AND speciesId = ?`;
      countQuery += ` AND speciesId = ?`;
      queryParams.push(params.speciesId);
    }
    
    // Pagination
    const page = params.page || 0;
    const size = params.size || 20;
    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    
    const rows = await db.getAllAsync(query, [...queryParams, size, page * size]) as any[];
    const countResult = await db.getFirstAsync(countQuery, queryParams) as { count: number } | null;

    const totalElements = countResult?.count || 0;
    const totalPages = Math.ceil(totalElements / size);

    return {
      content: rows as PlantResponse[],
      number: page,
      size,
      totalElements,
      totalPages,
      numberOfElements: rows.length,
      first: page === 0,
      last: page === totalPages - 1 || totalPages === 0,
      empty: rows.length === 0,
    };
  } catch (error) {
    console.error('[OfflineQuery] getOfflinePlants failed', error);
    return { content: [], number: 0, size: 0, totalElements: 0, totalPages: 0, numberOfElements: 0, first: true, last: true, empty: true };
  }
};

export const getOfflinePlantEvents = async (params: {
  farmPlotId?: string;
  farmZoneId?: string;
  plantId?: string;
}): Promise<PlantEventResponse[]> => {
  if (Platform.OS === 'web') return [];
  const db = await getDbAsync();
  try {
    let query = `SELECT * FROM plant_events WHERE _deleted = 0 AND parentPlantEventId IS NULL`;
    const queryParams: any[] = [];

    if (params.plantId) {
      query += ` AND plantId = ?`;
      queryParams.push(params.plantId);
    } else if (params.farmZoneId) {
      query += ` AND farmZoneId = ? AND plantId IS NULL`;
      queryParams.push(params.farmZoneId);
    } else if (params.farmPlotId) {
      query += ` AND farmPlotId = ? AND farmZoneId IS NULL AND plantId IS NULL`;
      queryParams.push(params.farmPlotId);
    }

    query += ` ORDER BY calculatedStartDate DESC`;

    const rows = await db.getAllAsync(query, queryParams) as any[];
    
    return rows.map(row => ({
      ...row,
      planned: row.planned === 1,
      completed: row.completed === 1,
      excludedPlantIds: row.excludedPlantIds ? JSON.parse(row.excludedPlantIds) : null,
      excludedFarmZoneIds: row.excludedFarmZoneIds ? JSON.parse(row.excludedFarmZoneIds) : null,
      tasks: row.tasks ? JSON.parse(row.tasks) : null,
      children: [], // For simplicity in offline mode, we don't eager-load the full recursive tree
    })) as PlantEventResponse[];
  } catch (error) {
    console.error('[OfflineQuery] getOfflinePlantEvents failed', error);
    return [];
  }
};

export const getOfflineSyncStatus = async (): Promise<Record<string, { lastSyncedAt: string | null }>> => {
  if (Platform.OS === 'web') return {};
  const db = await getDbAsync();
  try {
    const rows = await db.getAllAsync(`SELECT * FROM sync_metadata`) as any[];
    const status: Record<string, { lastSyncedAt: string | null }> = {};
    for (const row of rows) {
      status[row.tableName] = { lastSyncedAt: row.lastSyncedAt };
    }
    return status;
  } catch (error) {
    console.error('[OfflineQuery] getOfflineSyncStatus failed', error);
    return {};
  }
};

export const getOfflineRecordCounts = async (): Promise<Record<string, number>> => {
  if (Platform.OS === 'web') return {};
  const db = await getDbAsync();
  try {
    const tables = ['farm_plots', 'farm_zones', 'species', 'plants', 'plant_events'];
    const counts: Record<string, number> = {};
    for (const table of tables) {
      const result = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM ${table} WHERE _deleted = 0`
      ) as { count: number } | null;
      counts[table] = result?.count ?? 0;
    }
    return counts;
  } catch (error) {
    console.error('[OfflineQuery] getOfflineRecordCounts failed', error);
    return {};
  }
};
