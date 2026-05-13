import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initOfflineDatabase, clearOfflineDatabase } from '../services/offline-database';
import { getOfflineSyncStatus, getOfflineRecordCounts } from '../services/offline-query.service';
import { useAuthContext } from '@/src/features/auth';

interface OfflineDataContextState {
  isInitialized: boolean;
  syncStatus: Record<string, { lastSyncedAt: string | null }>;
  recordCounts: Record<string, number>;
  refreshSyncStatus: () => Promise<void>;
  refreshRecordCounts: () => Promise<void>;
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
  const { user } = useAuthContext();

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

  useEffect(() => {
    const init = async () => {
      await initOfflineDatabase();
      setIsInitialized(true);
      await Promise.all([refreshSyncStatus(), refreshRecordCounts()]);
    };
    init();
  }, []);

  return (
    <OfflineDataContext.Provider value={{ isInitialized, syncStatus, recordCounts, refreshSyncStatus, refreshRecordCounts }}>
      {children}
    </OfflineDataContext.Provider>
  );
};
