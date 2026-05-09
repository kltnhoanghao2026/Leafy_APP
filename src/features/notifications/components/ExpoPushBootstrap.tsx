import { useEffect, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useAuthContext } from "@/src/features/auth";
import { pushApi } from "../api/push.api";
import { useExpoPushStore } from "../store/useExpoPushStore";
import {
  requestPushPermission,
  getDevicePushToken,
  getPlatform,
} from "../services/expoPushService";

/**
 * Headless component — registers for FCM push notifications after login.
 * Mount once inside the authenticated layout (e.g., RootLayoutNav).
 *
 * Lifecycle:
 * 1. Wait for auth to restore.
 * 2. Request permission (iOS shows a native dialog; Android ≥ 13 requires it).
 * 3. Obtain FCM push token.
 * 4. Register token on the backend (skip if already synced for this user).
 * 5. Listen for foreground notifications and log them (add toast here if needed).
 */
export function ExpoPushBootstrap() {
  const { isAuthenticated, isRestoringAuth, user } = useAuthContext();
  const { startSync, markSynced, markSyncError, lastSyncedToken, lastSyncedUserId } =
    useExpoPushStore();

  const userId = user?.userId ?? null;

  const syncToken = useCallback(
    async (uid: string) => {
      const { syncStatus } = useExpoPushStore.getState();
      if (syncStatus === "syncing") return;

      startSync();
      try {
        const granted = await requestPushPermission();
        if (!granted) {
          console.log("[ExpoPush] Permission not granted.");
          markSyncError("Permission denied");
          return;
        }

        const token = await getDevicePushToken();
        if (!token) {
          markSyncError("Could not retrieve FCM push token");
          return;
        }

        // Skip re-registration if nothing changed
        if (lastSyncedToken === token && lastSyncedUserId === uid) {
          markSynced(token, uid);
          return;
        }

        await pushApi.registerToken({
          userId: uid,
          platform: getPlatform(),
          deviceIdentifier: `${Platform.OS}-${uid}`,
          fcmToken: token,
        });

        markSynced(token, uid);
        console.log("[ExpoPush] Token registered:", token);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Push sync failed";
        markSyncError(msg);
        console.error("[ExpoPush] Sync error:", err);
      }
    },
    [startSync, markSynced, markSyncError, lastSyncedToken, lastSyncedUserId],
  );

  // Trigger token sync once authenticated
  useEffect(() => {
    if (isRestoringAuth || !isAuthenticated || !userId) return;
    void syncToken(userId);
  }, [isAuthenticated, isRestoringAuth, userId, syncToken]);

  // Forward tapped notifications (background → foreground) to the app
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log(
          "[ExpoPush] Notification tapped:",
          response.notification.request.content,
        );
        // TODO: navigate based on notification data (deep-link)
        // const data = response.notification.request.content.data;
      },
    );
    return () => sub.remove();
  }, []);

  // Foreground notification received handler
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          "[ExpoPush] Foreground notification received:",
          notification.request.content.title,
        );
      },
    );
    return () => sub.remove();
  }, []);

  return null;
}
