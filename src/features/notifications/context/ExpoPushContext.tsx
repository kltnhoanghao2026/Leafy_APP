import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ExpoPushContextState {
  fcmToken: string | null;
  lastSyncedToken: string | null;
  lastSyncedUserId: string | null;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  error: string | null;

  startSync: () => void;
  setFcmToken: (token: string | null) => void;
  markSynced: (token: string, userId: string) => void;
  markSyncError: (error: string) => void;
  reset: () => void;
}

const defaultState = {
  fcmToken: null,
  lastSyncedToken: null,
  lastSyncedUserId: null,
  syncStatus: "idle" as const,
  error: null,
};

const STORAGE_KEY = "fcm-push-storage-v2";

const ExpoPushContext = createContext<ExpoPushContextState | null>(null);

export const useExpoPushContext = () => {
  const context = useContext(ExpoPushContext);
  if (!context) {
    throw new Error('useExpoPushContext must be used within an ExpoPushProvider');
  }
  return context;
};

export const ExpoPushProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{
    fcmToken: string | null;
    lastSyncedToken: string | null;
    lastSyncedUserId: string | null;
    syncStatus: "idle" | "syncing" | "synced" | "error";
    error: string | null;
  }>(defaultState);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only restore state inside the 'state' property structure from zustand persist
          // To be compatible with zustand's persist format, it looks like: { state: { ... } }
          const persistedState = parsed.state || parsed; 
          setState((prev) => ({
            ...prev,
            fcmToken: persistedState.fcmToken ?? null,
            lastSyncedToken: persistedState.lastSyncedToken ?? null,
            lastSyncedUserId: persistedState.lastSyncedUserId ?? null,
          }));
        }
      } catch (e) {
        console.error('Failed to load ExpoPush state:', e);
      }
    };
    loadState();
  }, []);

  // Save to AsyncStorage whenever persisted properties change
  useEffect(() => {
    const saveState = async () => {
      try {
        const toSave = {
          state: {
            fcmToken: state.fcmToken,
            lastSyncedToken: state.lastSyncedToken,
            lastSyncedUserId: state.lastSyncedUserId,
          },
          version: 0 // Zustand compatibility
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        console.error('Failed to save ExpoPush state:', e);
      }
    };
    // Debounce or just save directly since these don't change frequently
    saveState();
  }, [state.fcmToken, state.lastSyncedToken, state.lastSyncedUserId]);

  const startSync = useCallback(() => {
    setState((prev) => ({ ...prev, syncStatus: "syncing", error: null }));
  }, []);

  const setFcmToken = useCallback((token: string | null) => {
    setState((prev) => ({ ...prev, fcmToken: token }));
  }, []);

  const markSynced = useCallback((token: string, userId: string) => {
    setState((prev) => ({
      ...prev,
      fcmToken: token,
      lastSyncedToken: token,
      lastSyncedUserId: userId,
      syncStatus: "synced",
      error: null,
    }));
  }, []);

  const markSyncError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, syncStatus: "error", error }));
  }, []);

  const reset = useCallback(() => {
    setState({ ...defaultState });
  }, []);

  const value = useMemo(() => ({
    ...state,
    startSync,
    setFcmToken,
    markSynced,
    markSyncError,
    reset,
  }), [state, startSync, setFcmToken, markSynced, markSyncError, reset]);

  return (
    <ExpoPushContext.Provider value={value}>
      {children}
    </ExpoPushContext.Provider>
  );
};
