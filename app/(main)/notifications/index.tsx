import React from "react";
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
import { Bell, CheckCheck, Inbox, ShieldAlert } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  NotificationItem,
  NotificationSkeletonRow,
  useNotificationsScreen,
  type Tab,
  notificationKeys,
} from "@/src/features/notifications";
import { AlertEventCard } from "@/src/features/iot/components/AlertEventCard";

export default function SafeNotificationsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NotificationsScreen />
    </SafeAreaView>
  );
}

function NotificationsScreen() {
  const {
    t,
    activeTab,
    refreshing,
    unreadCount,
    isLoading,
    isError,
    alertEvents,
    alertCount,
    isAlertLoading,
    isAlertError,
    isFetchingNextPage,
    hasNextPage,
    notifications,
    hasUnread,
    markAllReadMutation,
    queryClient,
    handleNotificationPress,
    handleAlertPress,
    handleMarkAllRead,
    handleTabChange,
    handleEndReached,
    handleRefresh,
  } = useNotificationsScreen();

  return (
    <View style={styles.root}>
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

        {activeTab !== "alerts" && hasUnread && (
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
        {(["all", "unread", "alerts"] as Tab[]).map((tab) => {
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
                  : tab === "unread"
                    ? t("notifications.tabUnread", "Unread")
                    : t("notifications.tabAlerts", "Alerts")}
              </Text>
              {((tab === "unread" && unreadCount > 0) ||
                (tab === "alerts" && alertCount > 0)) && (
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
                    {(tab === "alerts" ? alertCount : unreadCount) > 99
                      ? "99+"
                      : tab === "alerts"
                        ? alertCount
                        : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── List ────────────────────────────────────────────────────────────── */}
      {activeTab === "alerts" ? (
        isAlertLoading && !refreshing ? (
          <View style={styles.skeletonContainer}>
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeletonRow key={i} />
            ))}
          </View>
        ) : isAlertError ? (
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
            <ShieldAlert size={40} color="#FCA5A5" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              {t("iot.alerts.loadFailed", "Unable to load alerts.")}
            </Text>
            <Text style={styles.emptySub}>
              {t("notifications.pageLoadErrorDetail", "Pull down to refresh.")}
            </Text>
          </ScrollView>
        ) : alertEvents.length === 0 ? (
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
              <ShieldAlert size={36} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>
              {t("iot.alerts.emptyTitle", "No alerts found")}
            </Text>
            <Text style={styles.emptySub}>
              {t("notifications.emptyAlertsSubtitle", "Open system alerts will appear here.")}
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            data={alertEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AlertEventCard alert={item} onPress={handleAlertPress} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#245A34"]}
                tintColor="#245A34"
              />
            }
            ListFooterComponent={
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {`${alertEvents.length} ${t("notifications.alertsShownCount", "alerts shown")}`}
                </Text>
              </View>
            }
            contentContainerStyle={styles.alertListContent}
          />
        )
      ) : isLoading && !refreshing ? (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 7 }).map((_, i) => (
            <NotificationSkeletonRow key={i} />
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
            {t("notifications.pageLoadErrorDetail", "Pull down to refresh.")}
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
              ? t("notifications.emptyUnreadSubtitle", "No unread notifications.")
              : t("notifications.emptyAllSubtitle", "Notifications will appear here.")}
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
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(36,90,52,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  headerBadgeInline: { fontSize: 14, fontWeight: "700", color: "#EF4444" },
  headerSub: { fontSize: 12, color: "#64748B", marginTop: 1 },
  markAllBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  markAllText: { fontSize: 12, fontWeight: "700", color: "#245A34" },
  tabBar: {
    flexDirection: "row", marginHorizontal: 16, marginVertical: 10,
    backgroundColor: "#F1F5F9", borderRadius: 14, padding: 3,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 8, borderRadius: 11, gap: 6,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#245A34" },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    paddingHorizontal: 4, alignItems: "center", justifyContent: "center",
  },
  tabBadgeActive: { backgroundColor: "#FEE2E2" },
  tabBadgeInactive: { backgroundColor: "#EF4444" },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  tabBadgeTextActive: { color: "#DC2626" },
  skeletonContainer: { paddingTop: 4 },
  emptyContainer: {
    flexGrow: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 10,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  emptySub: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: "#FEE2E2", borderRadius: 12,
  },
  retryBtnText: { fontSize: 13, fontWeight: "700", color: "#DC2626" },
  listEmpty: { flexGrow: 1 },
  alertListContent: { paddingHorizontal: 16, paddingBottom: 8 },
  footer: { paddingVertical: 20, alignItems: "center" },
  footerText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
});
