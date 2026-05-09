import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import {
  MessageCircle,
  ThumbsUp,
  UserPlus,
  MessageSquare,
  Bell,
  ClipboardCheck,
  ClipboardList,
} from "lucide-react-native";
import type { UserNotificationResponse } from "../types";
import { useTranslation } from "react-i18next";

interface NotificationItemProps {
  notification: UserNotificationResponse;
  onPress: (notification: UserNotificationResponse) => void;
}

// ── Icon / colour config per notification type ────────────────────────────────

function getTypeConfig(type: string) {
  switch (type) {
    case "POST_COMMENT":
    case "COMMENT_REPLY":
      return { Icon: MessageCircle, color: "#3B82F6", bg: "#EFF6FF" };
    case "POST_UPVOTE":
    case "COMMENT_UPVOTE":
      return { Icon: ThumbsUp, color: "#EC4899", bg: "#FDF2F8" };
    case "USER_FOLLOW":
      return { Icon: UserPlus, color: "#8B5CF6", bg: "#F5F3FF" };
    case "CONSULT_REQUEST":
      return { Icon: MessageSquare, color: "#F97316", bg: "#FFF7ED" };
    case "PLAN_CONSULTING_CREATED":
      return { Icon: ClipboardList, color: "#10B981", bg: "#ECFDF5" };
    case "PLAN_APPLIED":
      return { Icon: ClipboardCheck, color: "#16A34A", bg: "#F0FDF4" };
    default:
      return { Icon: Bell, color: "#64748B", bg: "#F8FAFC" };
  }
}

// ── Relative time helper ──────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string, t: ReturnType<typeof useTranslation>["t"]): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return t("notifications.timeJustNow", "Just now");

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t("notifications.timeMinutesAgo", "{{count}}m ago", { count: diffMin });

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t("notifications.timeHoursAgo", "{{count}}h ago", { count: diffHr });

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return t("notifications.timeDaysAgo", "{{count}}d ago", { count: diffDay });

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return t("notifications.timeMonthsAgo", "{{count}}mo ago", { count: diffMonth });

  return t("notifications.timeYearsAgo", "{{count}}y ago", { count: Math.floor(diffDay / 365) });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const { Icon, color, bg } = getTypeConfig(notification.type);
  const isAggregated = (notification.actorCount ?? 1) > 1;
  const timeAgo = formatTimeAgo(notification.occurredAt, t);

  const avatarUrl = notification.actorAvatar ?? undefined;
  const displayName =
    notification.actorName ?? t("notifications.defaultUser", "User");

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={[
        styles.container,
        !notification.isRead && styles.containerUnread,
      ]}
    >
      {/* Avatar + type badge */}
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: bg }]}>
            <Text style={[styles.avatarInitial, { color }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {/* Type icon badge */}
        <View style={[styles.typeBadge, { backgroundColor: bg }]}>
          <Icon size={10} color={color} strokeWidth={2.5} />
        </View>
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {isAggregated ? (
            notification.body
          ) : (
            <Text>
              <Text style={styles.actorName}>{displayName} </Text>
              {notification.body ||
                t("notifications.defaultInteraction", "interacted")}
            </Text>
          )}
        </Text>
        <Text
          style={[
            styles.time,
            !notification.isRead ? styles.timeUnread : styles.timeRead,
          ]}
        >
          {timeAgo}
        </Text>
      </View>

      {/* Unread dot */}
      {!notification.isRead && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  containerUnread: {
    backgroundColor: "#F0FDF4",
  },
  avatarWrapper: {
    position: "relative",
    width: 46,
    height: 46,
    marginTop: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "700",
  },
  typeBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  body: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  actorName: {
    fontWeight: "700",
    color: "#1E293B",
  },
  time: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  timeUnread: {
    color: "#16A34A",
  },
  timeRead: {
    color: "#94A3B8",
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#10B981",
    marginTop: 18,
    flexShrink: 0,
  },
});
