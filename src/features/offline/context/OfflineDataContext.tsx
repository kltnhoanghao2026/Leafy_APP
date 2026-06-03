import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initOfflineDatabase } from '../services/offline-database';
import { getOfflineSyncStatus, getOfflineRecordCounts } from '../services/offline-query.service';
import { getPendingCount } from '../services/sync-queue.service';
import { useOfflineSyncUp } from '../hooks/useOfflineSyncUp';
import { useAuthContext } from '@/src/features/auth';

interface OfflineDataContextState {
  isInitialized: boolean;
  syncStatus: Record<string, { lastSyncedAt: string | null }>;
  recordCounts: Record<string, number>;
  pendingCount: number;
  isSyncingUp: boolean;
  refreshSyncStatus: () => Promise<void>;
  refreshRecordCounts: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
  manualSyncUp: () => void;
}

const OfflineDataContext = createContext<OfflineDataContextState | null>(null);

export const useOfflineDataContext = () => {
  const context = useContext(OfflineDataContext);
  if (!context) {
    throw new Error('useOfflineDataContext must be used within an OfflineDataProvider');
  }
  return context;
};

export const OfflineDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, { lastSyncedAt: string | null }>>({});
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
  const [pendingCount, setPendingCount] = useState(0);
  useAuthContext();

  const { isSyncing: isSyncingUp, manualSync: manualSyncUp } = useOfflineSyncUp();

  const refreshSyncStatus = useCallback(async () => {
    try {
      const status = await getOfflineSyncStatus();
      setSyncStatus(status);
    } catch (e) {
      console.error('[OfflineData] Failed to refresh sync status', e);
    }
  }, []);

  const refreshRecordCounts = useCallback(async () => {
    try {
      const counts = await getOfflineRecordCounts();
      setRecordCounts(counts);
    } catch (e) {
      console.error('[OfflineData] Failed to refresh record counts', e);
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (e) {
      console.error('[OfflineData] Failed to refresh pending count', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await initOfflineDatabase();
      setIsInitialized(true);
      await Promise.all([refreshSyncStatus(), refreshRecordCounts(), refreshPendingCount()]);
    };
    init();
  }, []);

  // Refresh pending count every 5 seconds when initialized
  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(refreshPendingCount, 5000);
    return () => clearInterval(interval);
  }, [isInitialized, refreshPendingCount]);

  return (
    <OfflineDataContext.Provider value={{
      isInitialized, syncStatus, recordCounts, pendingCount, isSyncingUp,
      refreshSyncStatus, refreshRecordCounts, refreshPendingCount, manualSyncUp,
    }}>
      {children}
    </OfflineDataContext.Provider>
  );
};
