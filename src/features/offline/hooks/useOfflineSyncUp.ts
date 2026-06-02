import { useEffect, useRef, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { farmApi } from '@/src/features/farm';
import { plantApi } from '@/src/features/plant';
import { plantEventApi } from '@/src/features/plant-event';
import { apiClient } from '@/src/lib/axios';
import { API_ENDPOINTS } from '@/src/lib/routes';
import {
  getPendingItems,
  markItemDone,
  markItemFailed,
  clearDoneItems,
  getPendingCount,
} from '../services/sync-queue.service';
import { getDbAsync } from '../services/offline-database';
import { getServerId, rewriteIdsDeep, upsertIdMapping } from '../services/id-map.service';

export interface SyncUpResult {
  success: number;
  failed: number;
  total: number;
}

/**
 * Processes the pending sync queue by dispatching items to the backend API.
 * Returns a summary of successes and failures.
 */
const processSyncQueue = async (): Promise<SyncUpResult> => {
  const items = await getPendingItems();
  if (items.length === 0) return { success: 0, failed: 0, total: 0 };

  // Hydrate mapping from persistent store into memory for fast rewriting.
  const idMap = new Map<string, string>();
  for (const item of items) {
    if (!idMap.has(item.recordId)) {
      const mapped = await getServerId(item.recordId);
      if (mapped) idMap.set(item.recordId, mapped);
    }
  }

  // Build batch request in the backend DTO shape.
  const mutations = items.map((item) => {
    const rawPayload = JSON.parse(item.payload);
    const rewritten = rewriteIdsDeep(rawPayload, idMap) as any;

    // Sanitize dates for backend compatibility (append T00:00:00 to YYYY-MM-DD strings)
    for (const key of ['plantingDate', 'startDate', 'endDate', 'calculatedStartDate', 'calculatedEndDate']) {
      if (typeof rewritten?.[key] === 'string' && rewritten[key].trim().length === 10) {
        rewritten[key] = `${rewritten[key].trim()}T00:00:00`;
      }
    }

    return {
      id: item.id,
      tableName: item.tableName,
      recordId: item.recordId,
      operation: item.operation,
      payload: JSON.stringify(rewritten),
      createdAt: item.createdAt,
    };
  });

  const pushRes = await apiClient.post(API_ENDPOINTS.SYNC.PUSH, {
    deviceId: 'mobile',
    mutations,
    knownIdMappings: Array.from(idMap.entries()).map(([localId, serverId]) => ({
      localId,
      serverId,
      entityType: 'unknown',
    })),
  });

  const pushData = pushRes.data?.data;
  const mappings: Array<{ localId: string; serverId: string; entityType?: string }> = pushData?.idMappings ?? [];

  // Persist returned mappings + update local DB IDs and pending queue references.
  const db = await getDbAsync();
  for (const m of mappings) {
    if (!m?.localId || !m?.serverId) continue;
    idMap.set(m.localId, m.serverId);
    await upsertIdMapping({
      localId: m.localId,
      serverId: m.serverId,
      entityType: (m.entityType as any) ?? 'plants',
    });

    // Update entity tables if the localId exists there.
    for (const table of ['plants', 'plant_events', 'farm_plots', 'farm_zones']) {
      try {
        await db.runAsync(`UPDATE ${table} SET id = ?, _dirty = 0 WHERE id = ?`, [m.serverId, m.localId]);
      } catch {}
    }

    // Reconcile queue recordId + payload (payload is JSON string; we replace only exact id values later via rewrite, but keep this as a safety net)
    await db.runAsync(`UPDATE pending_sync_queue SET recordId = ? WHERE recordId = ?`, [m.serverId, m.localId]);
    await db.runAsync(
      `UPDATE pending_sync_queue SET payload = REPLACE(payload, ?, ?) WHERE payload LIKE ?`,
      [m.localId, m.serverId, `%${m.localId}%`],
    );
  }

  // Mark all mutations as done/failed based on server results.
  const results: Array<{ mutationId: string; applied: boolean; errorMessage?: string }> = pushData?.results ?? [];
  const resultById = new Map(results.map((r) => [r.mutationId, r] as const));

  let success = 0;
  let failed = 0;
  for (const item of items) {
    const r = resultById.get(item.id);
    if (r?.applied === false) {
      await markItemFailed(item.id, r.errorMessage ?? 'Sync failed');
      failed++;
      continue;
    }

    // Mark local record as clean for non-deletes.
    if (item.operation !== 'DELETE') {
      try {
        const currentRecordId = idMap.get(item.recordId) ?? item.recordId;
        await db.runAsync(`UPDATE ${item.tableName} SET _dirty = 0 WHERE id = ?`, [currentRecordId]);
      } catch {}
    }

    await markItemDone(item.id);
    success++;
  }

  await clearDoneItems();
  return { success, failed, total: items.length };
};

/**
 * Mounts a connectivity listener that automatically pushes pending
 * offline mutations to the backend when the device goes online.
 */
export function useOfflineSyncUp() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncUpResult | null>(null);
  const isSyncingRef = useRef(false);
  const wasOfflineRef = useRef(false);

  const runSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    const count = await getPendingCount();
    if (count === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      const result = await processSyncQueue();
      setLastResult(result);
      if (result.success > 0) {
        // Invalidate all relevant query caches so the online screens refresh
        queryClient.invalidateQueries({ queryKey: ['farm'] });
        queryClient.invalidateQueries({ queryKey: ['plant'] });
        queryClient.invalidateQueries({ queryKey: ['plantEvent'] });
        queryClient.invalidateQueries({ queryKey: ['offline'] });
      }
    } catch (err) {
      console.error('[SyncUp] Unexpected error during sync up', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [queryClient]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      if (isConnected && wasOfflineRef.current) {
        console.log('[SyncUp] Connectivity restored — triggering sync up');
        runSync();
      }
      wasOfflineRef.current = !isConnected;
    });

    return () => unsubscribe();
  }, [runSync]);

  const manualSync = useCallback(() => runSync(), [runSync]);

  return { isSyncing, lastResult, manualSync };
}
