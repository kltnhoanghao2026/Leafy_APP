import { useEffect, useRef, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { farmApi } from '@/src/features/farm';
import { plantApi } from '@/src/features/plant';
import { plantEventApi } from '@/src/features/plant-event';
import {
  getPendingItems,
  markItemDone,
  markItemFailed,
  clearDoneItems,
  getPendingCount,
} from '../services/sync-queue.service';
import { getDbAsync } from '../services/offline-database';
import type { PendingSyncItem } from '../services/sync-queue.service';

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
  let success = 0;
  let failed = 0;

  // ID Reconciliation Map (old UUID -> new ObjectId)
  const idMap = new Map<string, string>();

  for (const item of items) {
    try {
      // 1. Reconcile Payload (replace any old UUIDs with new ObjectIds)
      let payloadStr = item.payload;
      for (const [oldId, newId] of idMap.entries()) {
        payloadStr = payloadStr.replaceAll(oldId, newId);
      }
      
      const payload = JSON.parse(payloadStr);
      
      // 2. Reconcile Record ID
      const currentRecordId = idMap.get(item.recordId) ?? item.recordId;
      
      // Sanitize dates for backend compatibility (append T00:00:00 to YYYY-MM-DD strings)
      for (const key of ['plantingDate', 'startDate', 'endDate', 'calculatedStartDate', 'calculatedEndDate']) {
        if (typeof payload[key] === 'string' && payload[key].trim().length === 10) {
          payload[key] = `${payload[key].trim()}T00:00:00`;
        }
      }

      let serverResponse: any = null;

      switch (item.tableName) {
        case 'farm_plots':
          if (item.operation === 'CREATE') {
            const { id: _tempId, ...body } = payload;
            const res = await farmApi.createPlot(body);
            serverResponse = res.data.data;
          } else if (item.operation === 'UPDATE') {
            const { id, ...body } = payload;
            await farmApi.updatePlot(currentRecordId, body);
          } else if (item.operation === 'DELETE') {
            await farmApi.deletePlot(currentRecordId);
          }
          break;

        case 'farm_zones':
          if (item.operation === 'CREATE') {
            const { id: _tempId, farmPlotId, ...body } = payload;
            const res = await farmApi.createZone(farmPlotId, body);
            serverResponse = res.data.data;
          } else if (item.operation === 'UPDATE') {
            const { id, ...body } = payload;
            await farmApi.updateZone(currentRecordId, body);
          } else if (item.operation === 'DELETE') {
            await farmApi.deleteZone(currentRecordId);
          }
          break;

        case 'plants':
          if (item.operation === 'CREATE') {
            const { id: _tempId, ownerProfileId: _opi, ...body } = payload;
            const res = await plantApi.createPlant(body);
            serverResponse = res.data.data;
          } else if (item.operation === 'UPDATE') {
            const { id, ...body } = payload;
            await plantApi.updatePlant(currentRecordId, body);
          } else if (item.operation === 'DELETE') {
            await plantApi.deletePlant(currentRecordId);
          }
          break;

        case 'plant_events':
          if (item.operation === 'CREATE') {
            const { id: _tempId, ...body } = payload;
            const res = await plantEventApi.createEvent(body);
            serverResponse = res.data.data;
          } else if (item.operation === 'UPDATE') {
            const { id, ...body } = payload;
            await plantEventApi.updateEvent(currentRecordId, body);
          } else if (item.operation === 'DELETE') {
            await plantEventApi.deleteEvent(currentRecordId);
          }
          break;
      }

      // If server assigned a new ID (CREATE), update the local record
      if (item.operation === 'CREATE' && serverResponse?.id && serverResponse.id !== currentRecordId) {
        const newId = serverResponse.id;
        idMap.set(currentRecordId, newId);

        try {
          const db = await getDbAsync();
          const table = item.tableName;
          
          // 1. Update the actual entity table
          await db.runAsync(
            `UPDATE ${table} SET id = ?, _dirty = 0 WHERE id = ?`,
            [newId, currentRecordId]
          );

          // 2. Aggressively rewrite pending queue items that reference this UUID
          // This ensures that if the sync crashes, the database is already reconciled for the next attempt.
          await db.runAsync(
            `UPDATE pending_sync_queue SET recordId = ? WHERE recordId = ?`,
            [newId, currentRecordId]
          );
          
          await db.runAsync(
            `UPDATE pending_sync_queue SET payload = REPLACE(payload, ?, ?) WHERE payload LIKE ?`,
            [currentRecordId, newId, `%${currentRecordId}%`]
          );

        } catch (e) {
          console.warn('[SyncUp] Could not reconcile server ID', e);
        }
      } else if (item.operation !== 'DELETE') {
        // Mark local record as clean
        try {
          const db = await getDbAsync();
          await db.runAsync(
            `UPDATE ${item.tableName} SET _dirty = 0 WHERE id = ?`,
            [currentRecordId]
          );
        } catch {}
      }

      await markItemDone(item.id);
      success++;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      console.error(`[SyncUp] Failed to sync ${item.tableName}/${item.recordId}`, errMsg);
      await markItemFailed(item.id, errMsg);
      failed++;
    }
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
