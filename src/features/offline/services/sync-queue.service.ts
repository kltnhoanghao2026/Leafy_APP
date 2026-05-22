import { getDbAsync } from './offline-database';
import { Platform } from 'react-native';

// Polyfill-safe UUID generator
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncTable = 'farm_plots' | 'farm_zones' | 'plants' | 'plant_events';
export type SyncItemStatus = 'pending' | 'done' | 'failed';

export interface PendingSyncItem {
  id: string;
  tableName: SyncTable;
  recordId: string;
  operation: SyncOperation;
  payload: string; // JSON-encoded payload
  createdAt: string;
  status: SyncItemStatus;
  retryCount: number;
  lastError?: string | null;
  syncedAt?: string | null;
}

/**
 * Add a mutation to the pending sync queue.
 */
export const enqueueMutation = async (
  tableName: SyncTable,
  recordId: string,
  operation: SyncOperation,
  payload: Record<string, unknown>
): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  const id = generateUUID();
  const now = new Date().toISOString();
  try {
    await db.runAsync(
      `INSERT INTO pending_sync_queue (id, tableName, recordId, operation, payload, createdAt, status, retryCount)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 0)`,
      [id, tableName, recordId, operation, JSON.stringify(payload), now]
    );
    console.log(`[SyncQueue] Enqueued ${operation} for ${tableName}/${recordId}`);
  } catch (error) {
    console.error('[SyncQueue] Failed to enqueue mutation', error);
  }
};

/**
 * Get all pending items (status = 'pending').
 */
export const getPendingItems = async (): Promise<PendingSyncItem[]> => {
  if (Platform.OS === 'web') return [];
  const db = await getDbAsync();
  try {
    const rows = await db.getAllAsync(
      `SELECT * FROM pending_sync_queue WHERE status = 'pending' ORDER BY createdAt ASC`
    ) as any[];
    return rows as PendingSyncItem[];
  } catch (error) {
    console.error('[SyncQueue] Failed to get pending items', error);
    return [];
  }
};

/**
 * Count items with status = 'pending'.
 */
export const getPendingCount = async (): Promise<number> => {
  if (Platform.OS === 'web') return 0;
  const db = await getDbAsync();
  try {
    const result = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM pending_sync_queue WHERE status = 'pending'`
    ) as { count: number } | null;
    return result?.count ?? 0;
  } catch {
    return 0;
  }
};

/**
 * Mark a sync item as successfully synced.
 */
export const markItemDone = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  try {
    await db.runAsync(
      `UPDATE pending_sync_queue SET status = 'done', syncedAt = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
  } catch (error) {
    console.error('[SyncQueue] Failed to mark item done', error);
  }
};

/**
 * Mark a sync item as failed and record the error.
 */
export const markItemFailed = async (id: string, error: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  try {
    await db.runAsync(
      `UPDATE pending_sync_queue SET status = 'failed', lastError = ?, retryCount = retryCount + 1 WHERE id = ?`,
      [error, id]
    );
  } catch (err) {
    console.error('[SyncQueue] Failed to mark item failed', err);
  }
};

/**
 * Reset failed items back to pending (for retry).
 */
export const resetFailedItems = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  try {
    await db.runAsync(
      `UPDATE pending_sync_queue SET status = 'pending' WHERE status = 'failed'`
    );
  } catch (error) {
    console.error('[SyncQueue] Failed to reset failed items', error);
  }
};

/**
 * Remove all completed items from the queue.
 */
export const clearDoneItems = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  try {
    await db.runAsync(`DELETE FROM pending_sync_queue WHERE status = 'done'`);
  } catch (error) {
    console.error('[SyncQueue] Failed to clear done items', error);
  }
};

/**
 * Update the recordId of a sync item (used when server assigns a new ID after CREATE).
 */
export const updateSyncItemRecordId = async (oldRecordId: string, newRecordId: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  try {
    await db.runAsync(
      `UPDATE pending_sync_queue SET recordId = ? WHERE recordId = ? AND status = 'pending'`,
      [newRecordId, oldRecordId]
    );
  } catch (error) {
    console.error('[SyncQueue] Failed to update recordId', error);
  }
};

/**
 * Get all sync items regardless of status (useful for debugging).
 */
export const getAllSyncItems = async (): Promise<PendingSyncItem[]> => {
  if (Platform.OS === 'web') return [];
  const db = await getDbAsync();
  try {
    const rows = await db.getAllAsync(
      `SELECT * FROM pending_sync_queue ORDER BY createdAt DESC`
    ) as any[];
    return rows as PendingSyncItem[];
  } catch (error) {
    console.error('[SyncQueue] Failed to get all sync items', error);
    return [];
  }
};

/**
 * Delete a specific sync item by its ID.
 */
export const deleteSyncItem = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  try {
    await db.runAsync(`DELETE FROM pending_sync_queue WHERE id = ?`, [id]);
  } catch (error) {
    console.error('[SyncQueue] Failed to delete sync item', error);
  }
};
