import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import {
  useNotificationHistory,
  useNotificationState,
} from "../queries/queries";
import {
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
  useMarkCheckedMutation,
} from "../queries/mutations";
import { notificationKeys } from "../queries/keys";
import type { UserNotificationResponse } from "../types";
import { useAlertEvents } from "@/src/features/iot/hooks/useAlerts";
import type { AlertEventItemResponse } from "@/src/features/iot/types";
import { getIotAlertRoute, isIotAlertNotification } from "@/src/features/iot/utils/alertNotification";

export type Tab = "all" | "unread" | "alerts";

const NOTIFICATION_ROUTES: Record<
  string,
  (referenceId: string) => string | null
> = {
  POST_COMMENT: (id) => `/(main)/community/post/${id}`,
  POST_UPVOTE: (id) => `/(main)/community/post/${id}`,
  COMMENT_REPLY: (id) => `/(main)/community/post/${id}`,
  COMMENT_UPVOTE: (id) => `/(main)/community/post/${id}`,
  USER_FOLLOW: (id) => `/(main)/profile/${id}`,
  CONSULT_REQUEST: (id) => `/(main)/profile/${id}`,
  PLAN_CONSULTING_CREATED: () => null,
  PLAN_APPLIED: () => null,
  SYSTEM: () => null,
  IOT_ALERT: (id) => `/(main)/iot/alerts/${id}`,
  IOT_ALERT_EVENT: (id) => `/(main)/iot/alerts/${id}`,
  ALERT_EVENT: (id) => `/(main)/iot/alerts/${id}`,
  ALERT_TRIGGERED: (id) => `/(main)/iot/alerts/${id}`,
  DEVICE_ALERT: (id) => `/(main)/iot/alerts/${id}`,
};

export function useNotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [refreshing, setRefreshing] = useState(false);

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
  const alertEventsQuery = useAlertEvents({
    page: 0,
    size: 50,
    status: "OPEN",
    sortBy: "openedAt",
    sortDir: "desc",
  });

  const markCheckedMutation = useMarkCheckedMutation();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  useEffect(() => {
    if (unreadCount > 0) {
      markCheckedMutation.mutate();
    }
  }, [markCheckedMutation, unreadCount]);

  const notifications =
    historyData?.pages.flatMap((p) => p.data ?? []) ?? [];
  const alertEvents = alertEventsQuery.data?.items ?? [];
  const alertCount =
    alertEventsQuery.data?.totalItems ??
    alertEventsQuery.data?.totalElements ??
    alertEvents.length;
  const hasUnread = notifications.some((n) => !n.isRead);

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

    if (isIotAlertNotification({
      referenceId: notification.referenceId ?? undefined,
      type: notification.type,
    })) {
      const path = getIotAlertRoute({
        referenceId: notification.referenceId ?? undefined,
        type: notification.type,
      });
      if (path) {
        router.push(path as never);
      }
      return;
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

  const handleAlertPress = (alert: AlertEventItemResponse) => {
    router.push(`/(main)/iot/alerts/${alert.id}` as never);
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
    if (activeTab === "alerts") {
      return;
    }

    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [activeTab, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === "alerts") {
      await alertEventsQuery.refetch();
    } else {
      await refetch();
    }
    setRefreshing(false);
  }, [activeTab, alertEventsQuery, refetch]);

  return {
    t,
    activeTab,
    refreshing,
    unreadCount,
    isLoading,
    isError,
    alertEvents,
    alertCount,
    isAlertLoading: alertEventsQuery.isLoading,
    isAlertError: alertEventsQuery.isError,
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
  };
}
