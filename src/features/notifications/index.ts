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
export { useNotificationWebSocket } from "./hooks/useNotificationWebSocket";

// Store
export { useExpoPushContext, ExpoPushProvider } from "./context/ExpoPushContext";

// Components
export { NotificationItem } from "./components/NotificationItem";
export { ExpoPushBootstrap } from "./components/ExpoPushBootstrap";
