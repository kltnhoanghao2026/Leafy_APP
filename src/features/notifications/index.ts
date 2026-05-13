// Types
export type {
  UserNotificationResponse,
  NotificationStateResponse,
  InAppNotificationPayload,
  RegisterPushTokenPayload,
  NotificationPlatform,
} from "./types";

// Services
export {
  configurePushNotifications,
  requestPushPermission,
  getDevicePushToken,
  getPlatform,
  isPhysicalDevice,
} from "./services/expoPushService";

// Query keys
export { notificationKeys, pushKeys } from "./queries/keys";

// Queries
export {
  useNotificationState,
  useNotificationHistory,
} from "./queries/queries";

// Mutations
export {
  useRegisterPushTokenMutation,
  useDeactivatePushTokenMutation,
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
  useMarkCheckedMutation,
} from "./queries/mutations";

// Hooks
export * from "./hooks/useNotificationWebSocket";
export * from "./hooks/useNotificationsScreen";

// Store
export { useExpoPushContext, ExpoPushProvider } from "./context/ExpoPushContext";

// Components
export { NotificationItem } from "./components/NotificationItem";
export { NotificationSkeletonRow } from "./components/NotificationSkeletonRow";
export { ExpoPushBootstrap } from "./components/ExpoPushBootstrap";
