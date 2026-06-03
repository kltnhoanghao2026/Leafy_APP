import { Platform } from 'react-native';
import { getDbAsync } from './offline-database';

export type IdMapEntityType = 'plants' | 'plant_events' | 'farm_plots' | 'farm_zones';

export async function upsertIdMapping(params: {
  localId: string;
  serverId: string;
  entityType: IdMapEntityType;
}): Promise<void> {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  await db.runAsync(
    `INSERT OR REPLACE INTO id_map (localId, serverId, entityType, createdAt)
     VALUES (?, ?, ?, ?)`
    ,
    [params.localId, params.serverId, params.entityType, new Date().toISOString()],
  );
}

export async function getServerId(localId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const db = await getDbAsync();
  const row = (await db.getFirstAsync(
    `SELECT serverId FROM id_map WHERE localId = ?`,
    [localId],
  )) as { serverId: string } | null;
  return row?.serverId ?? null;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  return Object.prototype.toString.call(value) === '[object Object]';
};

/**
 * Deeply rewrites any string value that exactly matches a mapped localId.
 * This avoids fragile string replace on JSON.
 */
export function rewriteIdsDeep(value: unknown, idMap: Map<string, string>): unknown {
  if (typeof value === 'string') {
    return idMap.get(value) ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => rewriteIdsDeep(v, idMap));
  }

  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = rewriteIdsDeep(v, idMap);
    }
    return out;
  }

  return value;
}
