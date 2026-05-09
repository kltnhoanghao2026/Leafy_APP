import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ExpoPushState {
  fcmToken: string | null;
  lastSyncedToken: string | null;
  lastSyncedUserId: string | null;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  error: string | null;

  // Actions
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

export const useExpoPushStore = create<ExpoPushState>()(
  persist(
    (set) => ({
      ...defaultState,

      startSync: () => set({ syncStatus: "syncing", error: null }),

      setFcmToken: (token) => set({ fcmToken: token }),

      markSynced: (token, userId) =>
        set({
          fcmToken: token,
          lastSyncedToken: token,
          lastSyncedUserId: userId,
          syncStatus: "synced",
          error: null,
        }),

      markSyncError: (error) => set({ syncStatus: "error", error }),

      reset: () => set({ ...defaultState }),
    }),
    {
      name: "fcm-push-storage-v2",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the token — runtime state is re-derived on app start
      partialize: (state) => ({
        fcmToken: state.fcmToken,
        lastSyncedToken: state.lastSyncedToken,
        lastSyncedUserId: state.lastSyncedUserId,
      }),
    },
  ),
);
