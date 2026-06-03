import { getDbAsync } from './offline-database';
import { Platform } from 'react-native';
import { format } from 'date-fns';
import type { FarmPlotResponse, FarmZoneResponse, CreateFarmPlotRequest, UpdateFarmPlotRequest, CreateFarmZoneRequest, UpdateFarmZoneRequest } from '@/src/features/farm';
import type { PlantResponse, PlantCreateRequest, PlantUpdateRequest, SpeciesResponse, PageResponse } from '@/src/features/plant';
import type { PlantEventResponse, PlantEventCreateRequest, PlantEventUpdateRequest } from '@/src/features/plant-event';
import { enqueueMutation } from './sync-queue.service';
// Polyfill-safe UUID generator
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

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
  planApplyId?: string;
  eventType?: string;
  targetType?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}): Promise<PlantEventResponse[]> => {
  if (Platform.OS === 'web') return [];
  const db = await getDbAsync();

  const parseJson = <T,>(value: any, fallback: T): T => {
    if (!value || typeof value !== 'string') return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  };

  const mapRow = (row: any): PlantEventResponse => {
    const attachmentIds = parseJson<string[] | null>(row.attachmentIds, null);

    return {
      ...row,
      planned: row.planned === 1,
      completed: row.completed === 1,
      active: row.active !== 0,
      excludedPlantIds: parseJson<string[] | null>(row.excludedPlantIds, null),
      excludedFarmZoneIds: parseJson<string[] | null>(row.excludedFarmZoneIds, null),
      tasks: parseJson<any[] | null>(row.tasks, null) as any,
      attachmentIds,
      children: [],
    } as PlantEventResponse;
  };

  const loadChildren = async (parentId: string): Promise<PlantEventResponse[]> => {
    const childRows = (await db.getAllAsync(
      `SELECT * FROM plant_events WHERE _deleted = 0 AND parentPlantEventId = ? ORDER BY calculatedStartDate ASC`,
      [parentId],
    )) as any[];

    const children = childRows.map(mapRow);
    for (const child of children) {
      child.children = await loadChildren(child.id);
    }
    return children;
  };

  try {
    // Base query: parent-level events
    let query = `SELECT * FROM plant_events WHERE _deleted = 0 AND parentPlantEventId IS NULL`;
    const queryParams: any[] = [];

    // Scope filters (match server-side calendar semantics)
    if (params.plantId) {
      query += ` AND plantId = ?`;
      queryParams.push(params.plantId);
    }
    if (params.farmZoneId) {
      query += ` AND farmZoneId = ?`;
      queryParams.push(params.farmZoneId);
    }
    if (params.farmPlotId) {
      query += ` AND farmPlotId = ?`;
      queryParams.push(params.farmPlotId);
    }

    if (params.planApplyId) {
      query += ` AND planApplyId = ?`;
      queryParams.push(params.planApplyId);
    }

    if (params.eventType) {
      query += ` AND eventType = ?`;
      queryParams.push(params.eventType);
    }

    if (params.targetType) {
      query += ` AND targetType = ?`;
      queryParams.push(params.targetType);
    }

    // Date-range overlap filter (inclusive)
    if (params.startDate && params.endDate) {
      // overlap condition: start <= rangeEnd AND end >= rangeStart
      query += ` AND calculatedStartDate <= ? AND COALESCE(calculatedEndDate, calculatedStartDate) >= ?`;
      queryParams.push(params.endDate, params.startDate);
    }

    query += ` ORDER BY calculatedStartDate DESC`;

    const rows = (await db.getAllAsync(query, queryParams)) as any[];
    const parents = rows.map(mapRow);

    // Eager-load full tree so progress and UI parity match online
    for (const parent of parents) {
      parent.children = await loadChildren(parent.id);
    }

    return parents;
  } catch (error) {
    console.error('[OfflineQuery] getOfflinePlantEvents failed', error);
    return [];
  }
};

export const getOfflinePlantEventById = async (id: string): Promise<PlantEventResponse | null> => {
  if (Platform.OS === 'web') return null;
  const db = await getDbAsync();

  const parseJson = <T,>(value: any, fallback: T): T => {
    if (!value || typeof value !== 'string') return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  };

  const mapRow = (row: any): PlantEventResponse => {
    const attachmentIds = parseJson<string[] | null>(row.attachmentIds, null);
    return {
      ...row,
      planned: row.planned === 1,
      completed: row.completed === 1,
      active: row.active !== 0,
      excludedPlantIds: parseJson<string[] | null>(row.excludedPlantIds, null),
      excludedFarmZoneIds: parseJson<string[] | null>(row.excludedFarmZoneIds, null),
      tasks: parseJson<any[] | null>(row.tasks, null) as any,
      attachmentIds,
      children: [],
    } as PlantEventResponse;
  };

  const loadChildren = async (parentId: string): Promise<PlantEventResponse[]> => {
    const childRows = (await db.getAllAsync(
      `SELECT * FROM plant_events WHERE _deleted = 0 AND parentPlantEventId = ? ORDER BY calculatedStartDate ASC`,
      [parentId],
    )) as any[];

    const children = childRows.map(mapRow);
    for (const child of children) {
      child.children = await loadChildren(child.id);
    }
    return children;
  };

  try {
    const row = (await db.getFirstAsync(
      `SELECT * FROM plant_events WHERE id = ? AND _deleted = 0`,
      [id],
    )) as any;
    if (!row) return null;

    const event = mapRow(row);
    event.children = await loadChildren(event.id);
    return event;
  } catch (error) {
    console.error('[OfflineQuery] getOfflinePlantEventById failed', error);
    return null;
  }
};

export const toggleOfflinePlantEventTask = async (
  eventId: string,
  taskIndex: number,
): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  const now = new Date().toISOString();

  try {
    const row = (await db.getFirstAsync(
      `SELECT tasks FROM plant_events WHERE id = ? AND _deleted = 0`,
      [eventId],
    )) as any;

    const tasksRaw = row?.tasks as string | null;
    const tasks = tasksRaw ? (JSON.parse(tasksRaw) as any[]) : [];
    if (!Array.isArray(tasks) || !tasks[taskIndex]) return;

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      completed: !tasks[taskIndex].completed,
    };

    await db.runAsync(
      `UPDATE plant_events SET tasks = ?, lastModifiedAt = ?, _dirty = 1 WHERE id = ?`,
      [JSON.stringify(tasks), now, eventId],
    );

    await enqueueMutation('plant_events', eventId, 'UPDATE', {
      id: eventId,
      tasks,
    });
  } catch (error) {
    console.error('[OfflineQuery] toggleOfflinePlantEventTask failed', error);
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

// ─────────────────────────────────────────────────────────────────────────────
// WRITE OPERATIONS (offline mutations → SQLite + sync queue)
// ─────────────────────────────────────────────────────────────────────────────

// ── Plants ───────────────────────────────────────────────────────────────────

export const createOfflinePlant = async (
  data: PlantCreateRequest & { ownerProfileId?: string }
): Promise<PlantResponse> => {
  if (Platform.OS === 'web') throw new Error('Not supported on web');
  const db = await getDbAsync();
  const id = generateUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO plants
     (id, plantNumber, plantStatus, nickName, tagCode, batchNumber, sourceType, motherPlantId,
      plantingDate, germinationDate, actualHarvestDate, totalYieldKg, speciesId, farmPlotId,
      farmZoneId, ownerProfileId, createdAt, lastModifiedAt, _dirty, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      id, data.plantNumber ?? null, data.plantStatus, data.nickName ?? null, data.tagCode ?? null,
      data.batchNumber ?? null, data.sourceType ?? null, data.motherPlantId ?? null,
      data.plantingDate ?? null, data.germinationDate ?? null, data.actualHarvestDate ?? null,
      data.totalYieldKg ?? null, data.speciesId, data.farmPlotId,
      null, data.ownerProfileId ?? null, now, now,
    ]
  );
  await enqueueMutation('plants', id, 'CREATE', { ...data, id });
  return { id, plantNumber: data.plantNumber ?? id.slice(0, 8).toUpperCase(), plantStatus: data.plantStatus, speciesId: data.speciesId, farmPlotId: data.farmPlotId, createdAt: now, lastModifiedAt: now } as PlantResponse;
};

export const updateOfflinePlant = async (id: string, updates: PlantUpdateRequest): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];
  const map: Record<string, any> = {
    plantNumber: updates.plantNumber, plantStatus: updates.plantStatus, nickName: updates.nickName,
    tagCode: updates.tagCode, batchNumber: updates.batchNumber, sourceType: updates.sourceType,
    motherPlantId: updates.motherPlantId, plantingDate: updates.plantingDate,
    germinationDate: updates.germinationDate, actualHarvestDate: updates.actualHarvestDate,
    totalYieldKg: updates.totalYieldKg, speciesId: updates.speciesId, farmPlotId: updates.farmPlotId,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) { fields.push(`${k} = ?`); values.push(v ?? null); }
  }
  if (fields.length === 0) return;
  fields.push('lastModifiedAt = ?', '_dirty = 1');
  values.push(now, id);
  await db.runAsync(`UPDATE plants SET ${fields.join(', ')} WHERE id = ?`, values);
  await enqueueMutation('plants', id, 'UPDATE', { id, ...updates });
};

export const deleteOfflinePlant = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  await db.runAsync(`UPDATE plants SET _deleted = 1, _dirty = 1 WHERE id = ?`, [id]);
  await enqueueMutation('plants', id, 'DELETE', { id });
};

export const getOfflinePlantById = async (id: string): Promise<PlantResponse | null> => {
  if (Platform.OS === 'web') return null;
  const db = await getDbAsync();
  try {
    const row = await db.getFirstAsync(`SELECT * FROM plants WHERE id = ? AND _deleted = 0`, [id]) as any;
    return row ?? null;
  } catch { return null; }
};

// ── Farm Plots ────────────────────────────────────────────────────────────────

export const createOfflineFarmPlot = async (
  data: CreateFarmPlotRequest
): Promise<FarmPlotResponse> => {
  if (Platform.OS === 'web') throw new Error('Not supported on web');
  const db = await getDbAsync();
  const id = generateUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO farm_plots
     (id, ownerProfileId, name, code, description, areaM2, addressLine, provinceCode, districtCode,
      wardCode, latitude, longitude, boundaryGeojson, status, createdAt, lastModifiedAt, _dirty, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 1, 0)`,
    [
      id, data.ownerProfileId, data.name, null, data.description ?? null, data.areaM2 ?? null,
      data.addressLine ?? null, data.provinceCode ?? null, data.districtCode ?? null,
      data.wardCode ?? null, data.latitude ?? null, data.longitude ?? null, null, now, now,
    ]
  );
  await enqueueMutation('farm_plots', id, 'CREATE', { ...data, id });
  return { id, ownerProfileId: data.ownerProfileId, name: data.name, code: '', description: data.description ?? '', areaM2: data.areaM2 ?? 0, addressLine: data.addressLine ?? '', provinceCode: data.provinceCode ?? '', districtCode: data.districtCode ?? '', wardCode: data.wardCode ?? '', latitude: data.latitude ?? null, longitude: data.longitude ?? null, boundaryGeojson: null, status: 'ACTIVE', createdAt: now, lastModifiedAt: now };
};

export const updateOfflineFarmPlot = async (id: string, updates: UpdateFarmPlotRequest): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];
  const map: Record<string, any> = {
    name: updates.name, description: updates.description, areaM2: updates.areaM2,
    addressLine: updates.addressLine, provinceCode: updates.provinceCode,
    districtCode: updates.districtCode, wardCode: updates.wardCode,
    latitude: updates.latitude, longitude: updates.longitude, status: updates.status,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) { fields.push(`${k} = ?`); values.push(v ?? null); }
  }
  if (fields.length === 0) return;
  fields.push('lastModifiedAt = ?', '_dirty = 1');
  values.push(now, id);
  await db.runAsync(`UPDATE farm_plots SET ${fields.join(', ')} WHERE id = ?`, values);
  await enqueueMutation('farm_plots', id, 'UPDATE', { id, ...updates });
};

export const deleteOfflineFarmPlot = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  await db.runAsync(`UPDATE farm_plots SET _deleted = 1, _dirty = 1 WHERE id = ?`, [id]);
  await enqueueMutation('farm_plots', id, 'DELETE', { id });
};

// ── Farm Zones ────────────────────────────────────────────────────────────────

export const createOfflineFarmZone = async (
  farmPlotId: string,
  data: CreateFarmZoneRequest
): Promise<FarmZoneResponse> => {
  if (Platform.OS === 'web') throw new Error('Not supported on web');
  const db = await getDbAsync();
  const id = generateUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO farm_zones
     (id, farmPlotId, zoneName, zoneCode, description, areaM2, soilType, cropType, plantingDate,
      elevationM, boundaryGeojson, status, createdAt, lastModifiedAt, _dirty, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 1, 0)`,
    [
      id, farmPlotId, data.zoneName, data.zoneCode, data.description ?? null,
      data.areaM2 ?? null, data.soilType ?? null, data.cropType ?? null,
      data.plantingDate ?? null, data.elevationM ?? null, null, now, now,
    ]
  );
  await enqueueMutation('farm_zones', id, 'CREATE', { farmPlotId, ...data, id });
  return { id, farmPlotId, zoneName: data.zoneName, zoneCode: data.zoneCode, description: data.description ?? '', areaM2: data.areaM2 ?? 0, soilType: data.soilType ?? '', cropType: data.cropType ?? '', plantingDate: data.plantingDate ?? '', elevationM: data.elevationM ?? 0, boundaryGeojson: null, status: 'ACTIVE', createdAt: now, lastModifiedAt: now };
};

export const updateOfflineFarmZone = async (id: string, updates: UpdateFarmZoneRequest): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];
  const map: Record<string, any> = {
    zoneName: updates.zoneName, zoneCode: updates.zoneCode, description: updates.description,
    areaM2: updates.areaM2, soilType: updates.soilType, cropType: updates.cropType,
    plantingDate: updates.plantingDate, elevationM: updates.elevationM, status: updates.status,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) { fields.push(`${k} = ?`); values.push(v ?? null); }
  }
  if (fields.length === 0) return;
  fields.push('lastModifiedAt = ?', '_dirty = 1');
  values.push(now, id);
  await db.runAsync(`UPDATE farm_zones SET ${fields.join(', ')} WHERE id = ?`, values);
  await enqueueMutation('farm_zones', id, 'UPDATE', { id, ...updates });
};

export const deleteOfflineFarmZone = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  await db.runAsync(`UPDATE farm_zones SET _deleted = 1, _dirty = 1 WHERE id = ?`, [id]);
  await enqueueMutation('farm_zones', id, 'DELETE', { id });
};

// ── Plant Events ──────────────────────────────────────────────────────────────

export const createOfflinePlantEvent = async (
  data: PlantEventCreateRequest
): Promise<PlantEventResponse> => {
  if (Platform.OS === 'web') throw new Error('Not supported on web');
  const db = await getDbAsync();
  const id = generateUUID();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO plant_events
     (id, plantId, farmPlotId, farmZoneId, targetType, eventType, note, description, daysFromStart,
      durationDays, planned, calculatedStartDate, calculatedEndDate, phiDays, ppeRequired, mrlNote,
      estimatedCost, sourcePlanId, planApplyId, parentPlantEventId, completed, trackingGranularity,
      excludedPlantIds, excludedFarmZoneIds, progressTotal, progressCompleted, tasks,
      createdAt, lastModifiedAt, _dirty, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, 0, ?, ?, ?, 1, 0)`,
    [
      id, data.plantId ?? null, data.farmPlotId ?? null, data.farmZoneId ?? null,
      data.targetType ?? null, data.eventType, data.note, data.description ?? null,
      data.daysFromStart ?? null, data.durationDays ?? null, data.isPlanned ? 1 : 0,
      data.calculatedStartDate ?? null, data.calculatedEndDate ?? null,
      data.phiDays ?? null, data.ppeRequired ?? null, data.mrlNote ?? null,
      data.estimatedCost ?? null, data.sourcePlanId ?? null, data.planApplyId ?? null,
      data.parentPlantEventId ?? null, data.trackingGranularity ?? null,
      data.excludedPlantIds ? JSON.stringify(data.excludedPlantIds) : null,
      data.excludedFarmZoneIds ? JSON.stringify(data.excludedFarmZoneIds) : null,
      data.tasks ? JSON.stringify(data.tasks) : null, now, now,
    ]
  );
  await enqueueMutation('plant_events', id, 'CREATE', { ...data, id });
  return { id, eventType: data.eventType, note: data.note, planned: data.isPlanned ?? false, completed: false, active: true, tasks: null, children: [], createdAt: now, lastModifiedAt: now } as unknown as PlantEventResponse;
};

export const updateOfflinePlantEvent = async (id: string, updates: PlantEventUpdateRequest): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];
  const map: Record<string, any> = {
    eventType: updates.eventType, note: updates.note, description: updates.description,
    calculatedStartDate: updates.calculatedStartDate, calculatedEndDate: updates.calculatedEndDate,
    durationDays: updates.durationDays, phiDays: updates.phiDays,
    ppeRequired: updates.ppeRequired, mrlNote: updates.mrlNote, estimatedCost: updates.estimatedCost,
    completed: updates.completed !== undefined ? (updates.completed ? 1 : 0) : undefined,
    planned: updates.isPlanned !== undefined ? (updates.isPlanned ? 1 : 0) : undefined,
    tasks: updates.tasks !== undefined ? JSON.stringify(updates.tasks) : undefined,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) { fields.push(`${k} = ?`); values.push(v ?? null); }
  }
  if (fields.length === 0) return;
  fields.push('lastModifiedAt = ?', '_dirty = 1');
  values.push(now, id);
  await db.runAsync(`UPDATE plant_events SET ${fields.join(', ')} WHERE id = ?`, values);
  await enqueueMutation('plant_events', id, 'UPDATE', { id, ...updates });
};

export const deleteOfflinePlantEvent = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  await db.runAsync(`UPDATE plant_events SET _deleted = 1, _dirty = 1 WHERE id = ?`, [id]);
  await enqueueMutation('plant_events', id, 'DELETE', { id });
};

export const toggleOfflinePlantEventCompleted = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE plant_events SET completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END, lastModifiedAt = ?, _dirty = 1 WHERE id = ?`,
    [now, id]
  );
  const row = await db.getFirstAsync(`SELECT completed FROM plant_events WHERE id = ?`, [id]) as { completed: number } | null;
  await enqueueMutation('plant_events', id, 'UPDATE', { id, completed: row?.completed === 1 });
};

export const getOfflineAgricultureStats = async (): Promise<any> => {
  if (Platform.OS === 'web') return null;
  const db = await getDbAsync();
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  
  try {
    const activePlantsRow = await db.getFirstAsync(`SELECT COUNT(*) as c FROM plants WHERE _deleted = 0 AND plantStatus = 'ACTIVE'`) as any;
    const totalPlantsRow = await db.getFirstAsync(`SELECT COUNT(*) as c FROM plants WHERE _deleted = 0`) as any;
    const totalFarmPlotsRow = await db.getFirstAsync(`SELECT COUNT(*) as c FROM farm_plots WHERE _deleted = 0`) as any;
    const totalFarmZonesRow = await db.getFirstAsync(`SELECT COUNT(*) as c FROM farm_zones WHERE _deleted = 0`) as any;
    
    const totalPendingEventsRow = await db.getFirstAsync(`SELECT COUNT(*) as c FROM plant_events WHERE _deleted = 0 AND completed = 0 AND parentPlantEventId IS NULL`) as any;
    const totalCompletedEventsRow = await db.getFirstAsync(`SELECT COUNT(*) as c FROM plant_events WHERE _deleted = 0 AND completed = 1 AND parentPlantEventId IS NULL`) as any;
    
    const todayEventsRow = await db.getFirstAsync(`SELECT COUNT(*) as c FROM plant_events WHERE _deleted = 0 AND parentPlantEventId IS NULL AND calculatedStartDate LIKE ?`, [`${todayDate}%`]) as any;
    const todayCompletedEventsRow = await db.getFirstAsync(`SELECT COUNT(*) as c FROM plant_events WHERE _deleted = 0 AND completed = 1 AND parentPlantEventId IS NULL AND calculatedStartDate LIKE ?`, [`${todayDate}%`]) as any;
    
    const overdueEventsRow = await db.getFirstAsync(`SELECT COUNT(*) as c FROM plant_events WHERE _deleted = 0 AND completed = 0 AND parentPlantEventId IS NULL AND calculatedEndDate < ?`, [todayDate]) as any;
    
    return {
      activePlants: activePlantsRow?.c || 0,
      totalPlants: totalPlantsRow?.c || 0,
      totalFarmPlots: totalFarmPlotsRow?.c || 0,
      totalFarmZones: totalFarmZonesRow?.c || 0,
      totalPendingEvents: totalPendingEventsRow?.c || 0,
      totalCompletedEvents: totalCompletedEventsRow?.c || 0,
      todayEvents: todayEventsRow?.c || 0,
      todayCompletedEvents: todayCompletedEventsRow?.c || 0,
      overdueEvents: overdueEventsRow?.c || 0,
      totalPlans: 0,
      activePlanApplies: 0,
      completedPlanApplies: 0,
    };
  } catch (error) {
    console.error('[OfflineQuery] getOfflineAgricultureStats failed', error);
    return null;
  }
};
