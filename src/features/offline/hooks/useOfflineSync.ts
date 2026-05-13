import { useState, useCallback, useRef } from 'react';
import { syncAll, type SyncTableKey, type SyncTableStatus, type SyncResult } from '../services/offline-sync.service';
import { useAuthContext } from '@/src/features/auth';
import { useOfflineDataContext } from '../context/OfflineDataContext';

export type SyncState = 'idle' | 'syncing' | 'success' | 'error';

export interface PerTableProgress {
  status: SyncTableStatus;
  count: number;
  error?: string;
}

export type SyncProgressMap = Record<SyncTableKey, PerTableProgress>;

const initialProgress = (): SyncProgressMap => ({
  farm_plots: { status: 'idle', count: 0 },
  farm_zones: { status: 'idle', count: 0 },
  species: { status: 'idle', count: 0 },
  plants: { status: 'idle', count: 0 },
  plant_events: { status: 'idle', count: 0 },
});

export function useOfflineSync() {
  const { profileId } = useAuthContext();
  const { refreshSyncStatus, refreshRecordCounts } = useOfflineDataContext();

  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [progress, setProgress] = useState<SyncProgressMap>(initialProgress());
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Track if a sync is currently running to prevent duplicate calls
  const isSyncingRef = useRef(false);

  const triggerSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (!profileId) {
      setLastError('User profile not found. Please log in again.');
      setSyncState('error');
      return;
    }

    isSyncingRef.current = true;
    setSyncState('syncing');
    setLastError(null);
    setSyncResult(null);
    setProgress(initialProgress());

    try {
      const result = await syncAll(profileId, (table, status, count = 0, error) => {
        setProgress(prev => ({
          ...prev,
          [table]: { status, count, error },
        }));
      });

      setSyncResult(result);
      setSyncState(result.success ? 'success' : 'error');

      if (!result.success) {
        setLastError('Some data could not be synced. Check individual tables for details.');
      }

      // Refresh context so dashboard & status cards update
      await refreshSyncStatus();
      await refreshRecordCounts?.();
    } catch (err: any) {
      console.error('[useOfflineSync] Unexpected sync error', err);
      setSyncState('error');
      setLastError(err?.message ?? 'An unexpected error occurred during sync.');
    } finally {
      isSyncingRef.current = false;
    }
  }, [profileId, refreshSyncStatus, refreshRecordCounts]);

  const resetSync = useCallback(() => {
    if (isSyncingRef.current) return;
    setSyncState('idle');
    setSyncResult(null);
    setLastError(null);
    setProgress(initialProgress());
  }, []);

  // Derived helpers
  const isSyncing = syncState === 'syncing';

  const overallProgress = (() => {
    const values = Object.values(progress);
    const done = values.filter(v => v.status === 'done' || v.status === 'error').length;
    return values.length > 0 ? done / values.length : 0;
  })();

  return {
    syncState,
    isSyncing,
    progress,
    syncResult,
    lastError,
    overallProgress,
    triggerSync,
    resetSync,
  };
}
