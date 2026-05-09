/**
 * Shared notification types — mirrors Leafy_FE's notification types
 * adapted for React Native (platform: ANDROID | IOS instead of WEB).
 */

export type NotificationPlatform = "ANDROID" | "IOS" | "WEB";

export interface RegisterPushTokenPayload {
  userId: string;
  platform: NotificationPlatform;
  deviceIdentifier: string;
  fcmToken: string;
}

export interface UserNotificationResponse {
  id: string;
  type: string;
  referenceId: string | null;
  /** Most-recent actor (alias for `actorIds[0]`). */
  actorId: string | null;
  actorName: string | null;
  actorAvatar: string | null;
  /**
   * Distinct profile IDs of all actors merged into this notification —
   * most-recent first.
   */
  actorIds: string[];
  /** `actorIds.length` — denormalized for fast read access. */
  actorCount: number;
  /** `max(0, actorCount - 1)` — used for "X and N others" rendering. */
  othersCount: number;
  /** Total number of raw events merged into this notification. */
  totalEventCount: number;
  title: string;
  body: string;
  isRead: boolean;
  occurredAt: string;
}

export interface NotificationStateResponse {
  unreadCount: number;
  lastCheckedAt: string | null;
}

export interface InAppNotificationPayload {
  notificationId: string;
  type: string;
  referenceId: string | null;
  actorId: string | null;
  actorName: string | null;
  actorAvatar: string | null;
  actorIds: string[];
  actorCount: number;
  othersCount: number;
  totalEventCount: number;
  title: string;
  body: string;
  occurredAt: string;
}
