import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Bell, CheckCheck, Inbox } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useNotificationHistory,
  useNotificationState,
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
  useMarkCheckedMutation,
  notificationKeys,
  useNotificationWebSocket,
  NotificationItem,
} from "@/src/features/notifications";
import type { UserNotificationResponse } from "@/src/features/notifications";

// ── Deep-link routing map ─────────────────────────────────────────────────────

const NOTIFICATION_ROUTES: Record<
  string,
  (referenceId: string) => string | null
> = {
  POST_COMMENT: (id) => `/community-post/${id}`,
  POST_UPVOTE: (id) => `/community-post/${id}`,
  COMMENT_REPLY: (id) => `/community-post/${id}`,
  COMMENT_UPVOTE: (id) => `/community-post/${id}`,
  USER_FOLLOW: (id) => `/(main)/profile/${id}`,
  CONSULT_REQUEST: (id) => `/(main)/profile/${id}`,
  PLAN_CONSULTING_CREATED: () => null,
  PLAN_APPLIED: () => null,
  SYSTEM: () => null,
};

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: "70%" }]} />
        <View style={[styles.skeletonLine, { width: "50%", height: 10 }]} />
      </View>
    </View>
  );
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = "all" | "unread";

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Activate real-time updates via WebSocket
  useNotificationWebSocket();

  const { data: stateData } = useNotificationState();
  const unreadCount = stateData?.data?.unreadCount ?? 0;

  const {
    data: historyData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useNotificationHistory(activeTab === "unread", true);

  const markCheckedMutation = useMarkCheckedMutation();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  // Clear badge count on mount
  useEffect(() => {
    if (unreadCount > 0) {
      markCheckedMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifications =
    historyData?.pages.flatMap((p) => p.data ?? []) ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleNotificationPress = (
    notification: UserNotificationResponse,
  ) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: notificationKeys.state(),
          });
          queryClient.invalidateQueries({
            queryKey: [...notificationKeys.all(), "history"],
          });
        },
      });
    }

    if (notification.referenceId && notification.type) {
      const routeFn = NOTIFICATION_ROUTES[notification.type];
      if (routeFn) {
        const path = routeFn(notification.referenceId);
        if (path) {
          router.push(path as never);
        }
      }
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.state() });
        queryClient.invalidateQueries({
          queryKey: [...notificationKeys.all(), "history"],
        });
      },
    });
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    queryClient.invalidateQueries({
      queryKey: notificationKeys.history(tab === "unread"),
    });
  };

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Bell size={20} color="#245A34" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {t("notifications.pageTitle", "Notifications")}
              {unreadCount > 0 && (
                <Text style={styles.headerBadgeInline}>
                  {"  "}
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              )}
            </Text>
            <Text style={styles.headerSub}>
              {t("notifications.pageSubtitle", "Stay up to date")}
            </Text>
          </View>
        </View>

        {hasUnread && (
          <Pressable
            onPress={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            style={styles.markAllBtn}
          >
            <CheckCheck size={15} color="#245A34" />
            <Text style={styles.markAllText}>
              {t("notifications.pageMarkAllRead", "Mark all read")}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Tab segmented control ────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {(["all", "unread"] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => handleTabChange(tab)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, isActive && styles.tabTextActive]}
              >
                {tab === "all"
                  ? t("notifications.tabAll", "All")
                  : t("notifications.tabUnread", "Unread")}
              </Text>
              {tab === "unread" && unreadCount > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    isActive ? styles.tabBadgeActive : styles.tabBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      isActive && styles.tabBadgeTextActive,
                    ]}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── List ────────────────────────────────────────────────────────────── */}
      {isLoading && !refreshing ? (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : isError ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#245A34"]}
              tintColor="#245A34"
            />
          }
        >
          <Bell size={40} color="#FCA5A5" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>
            {t("notifications.pageLoadError", "Failed to load")}
          </Text>
          <Text style={styles.emptySub}>
            {t(
              "notifications.pageLoadErrorDetail",
              "Pull down to refresh.",
            )}
          </Text>
          <Pressable
            onPress={() =>
              queryClient.invalidateQueries({
                queryKey: notificationKeys.history(),
              })
            }
            style={styles.retryBtn}
          >
            <Text style={styles.retryBtnText}>
              {t("notifications.pageTryAgain", "Try again")}
            </Text>
          </Pressable>
        </ScrollView>
      ) : notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#245A34"]}
              tintColor="#245A34"
            />
          }
        >
          <View style={styles.emptyIconWrap}>
            <Inbox size={36} color="#10B981" strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === "unread"
              ? t("notifications.emptyUnreadTitle", "All caught up!")
              : t("notifications.emptyAllTitle", "No notifications yet")}
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === "unread"
              ? t(
                  "notifications.emptyUnreadSubtitle",
                  "No unread notifications.",
                )
              : t(
                  "notifications.emptyAllSubtitle",
                  "Notifications will appear here.",
                )}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
            />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#245A34"]}
              tintColor="#245A34"
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color="#245A34"
                style={{ paddingVertical: 20 }}
              />
            ) : !hasNextPage && notifications.length >= 20 ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {`${notifications.length} ${t("notifications.allShownCount", "notifications shown")}`}
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={
            notifications.length === 0 ? styles.listEmpty : undefined
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(36,90,52,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerBadgeInline: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  headerSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#245A34",
  },
  // ── Tabs
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 11,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#245A34",
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeActive: {
    backgroundColor: "#FEE2E2",
  },
  tabBadgeInactive: {
    backgroundColor: "#EF4444",
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tabBadgeTextActive: {
    color: "#DC2626",
  },
  // ── Skeleton
  skeletonContainer: {
    paddingTop: 4,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  skeletonAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E2E8F0",
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  // ── Empty / Error
  emptyContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  listEmpty: {
    flexGrow: 1,
  },
  // ── Footer
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
});
