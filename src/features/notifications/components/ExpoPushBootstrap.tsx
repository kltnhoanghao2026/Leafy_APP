import { useEffect, useCallback, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/src/features/auth";
import { pushApi } from "../api/push.api";
import { useIsOffline } from "@/src/providers/NetworkProvider";
import { useExpoPushContext } from "../context/ExpoPushContext";
import { queryClient } from "@/src/lib";
import { iotKeys } from "@/src/features/iot/hooks/useDevices";
import {
  getIotAlertIdFromPayload,
  getIotAlertRoute,
  isIotAlertNotification,
  resolveIotNotificationText,
} from "@/src/features/iot/utils/alertNotification";
import { notificationKeys } from "../queries/keys";
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
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, isRestoringAuth, user } = useAuthContext();
  const { startSync, markSynced, markSyncError, lastSyncedToken, lastSyncedUserId, syncStatus } =
    useExpoPushContext();
  const isOffline = useIsOffline();

  const userId = user?.userId ?? null;

  const syncToken = useCallback(
    async (uid: string) => {
      if (syncStatus === "syncing" || isOffline) return;

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
        console.warn("[ExpoPush] Sync error:", err);
      }
    },
    [startSync, markSynced, markSyncError, lastSyncedToken, lastSyncedUserId, syncStatus, isOffline],
  );

  const attemptedUserIdRef = useRef<string | null>(null);

  const handleIotAlertPayload = useCallback(
    (data?: Record<string, unknown> | null, navigate = false) => {
      if (!isIotAlertNotification(data)) {
        return false;
      }

      const alertId = getIotAlertIdFromPayload(data);
      queryClient.invalidateQueries({ queryKey: iotKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.state() });
      queryClient.invalidateQueries({ queryKey: [...notificationKeys.all(), "history"] });
      if (alertId) {
        queryClient.invalidateQueries({ queryKey: iotKeys.alertDetail(alertId) });
      }

      if (navigate) {
        const route = getIotAlertRoute(data);
        if (route) {
          router.push(route as never);
        }
      }

      return true;
    },
    [router],
  );

  // Trigger token sync once authenticated
  useEffect(() => {
    if (isRestoringAuth || !isAuthenticated || !userId || isOffline) return;
    
    // Prevent infinite loop if syncStatus changes cause syncToken to recreate
    if (attemptedUserIdRef.current === userId) return;
    attemptedUserIdRef.current = userId;
    
    void syncToken(userId);
  }, [isAuthenticated, isRestoringAuth, userId, isOffline, syncToken]);

  // Forward tapped notifications (background → foreground) to the app
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        console.log(
          "[ExpoPush] Notification tapped:",
          response.notification.request.content,
        );
        handleIotAlertPayload(
          response.notification.request.content.data as Record<string, unknown>,
          true,
        );
      },
    );
    return () => sub.remove();
  }, [handleIotAlertPayload]);

  // Handle tapped notification that launched a killed/cold app.
  useEffect(() => {
    let mounted = true;
    void Notifications.getLastNotificationResponseAsync().then((response: any) => {
      if (!mounted || !response) {
        return;
      }
      handleIotAlertPayload(
        response.notification.request.content.data as Record<string, unknown>,
        true,
      );
    });
    return () => {
      mounted = false;
    };
  }, [handleIotAlertPayload]);

  // Foreground notification received handler
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        console.log(
          "[ExpoPush] Foreground notification received:",
          notification.request.content.title,
        );
        const data = notification.request.content.data as Record<string, unknown>;
        if (handleIotAlertPayload(data, false)) {
          const { title, body } = resolveIotNotificationText(data, t);
          const hasTranslationKeys =
            typeof data.titleKey === "string" || typeof data.bodyKey === "string";
          void Notifications.setNotificationCategoryAsync("iot-alert", []);
          void Notifications.setBadgeCountAsync(1);
          if (hasTranslationKeys) {
            void Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: {
                  ...data,
                  localizedIotAlert: true,
                  titleKey: undefined,
                  bodyKey: undefined,
                },
              },
              trigger: null,
            });
          }
          console.log("[ExpoPush] IoT alert notification:", title, body);
        }
      },
    );
    return () => sub.remove();
  }, [handleIotAlertPayload, t]);

  return null;
}
