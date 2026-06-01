import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { NotificationPlatform } from "../types";
import { isIotAlertNotification } from "@/src/features/iot/utils/alertNotification";

const NATIVE_FCM_REQUIREMENT =
  "Native FCM push requires a development or production build with valid Firebase native configuration. " +
  "Expo Go is not supported for this push flow.";

/**
 * Configure how incoming push notifications appear while the app is
 * in the foreground. Call this once at app startup (before rendering).
 */
export function configurePushNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification: any) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      const hasIotTranslationKeys =
        isIotAlertNotification(data) &&
        (typeof data?.titleKey === "string" || typeof data?.bodyKey === "string");

      return {
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: !hasIotTranslationKeys,
        shouldShowList: !hasIotTranslationKeys,
      };
    },
  });
}

/**
 * Request permission to display push notifications.
 * Returns `true` if the user granted permission (or it was already granted).
 */
export async function requestPushPermission(): Promise<boolean> {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Returns true when running on a real physical device.
 * Push tokens are NOT available on simulators or in Expo Go without FCM credentials.
 */
export function isPhysicalDevice(): boolean {
  return Device.isDevice === true;
}

/**
 * Retrieve the native FCM push token for this device.
 * Returns null when running on a simulator or Expo Go without FCM credentials.
 */
export async function getDevicePushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log(
      "[ExpoPush] Native FCM token sync skipped: this is not a physical device. " +
        "Use an Android/iOS physical device for IoT alert push QA.",
    );
    return null;
  }

  // Check if we're inside Expo Go (managed workflow without FCM setup)
  const isExpoGo =
    Constants.executionEnvironment === "storeClient" ||
    (Constants.appOwnership === "expo");

  if (isExpoGo) {
    console.log(
      `[ExpoPush] Native FCM token sync skipped: running in Expo Go. ${NATIVE_FCM_REQUIREMENT}`,
    );
    return null;
  }

  try {
    const result = await Notifications.getDevicePushTokenAsync();
    return result.data; // Native FCM token (or APNs token on iOS)
  } catch (err) {
    console.warn(
      "[ExpoPush] Failed to get native device push token. " +
        `${NATIVE_FCM_REQUIREMENT} ` +
        "For Android, verify Leafy_APP/google-services.json exists and matches expo.android.package. " +
        "For iOS, verify Firebase/APNs setup returns an FCM-compatible token.",
      err,
    );
    return null;
  }
}

/**
 * Returns the platform string expected by the backend Platform enum.
 */
export function getPlatform(): NotificationPlatform {
  if (Platform.OS === "ios") return "IOS";
  return "ANDROID";
}
