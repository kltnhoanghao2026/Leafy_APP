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

export type Tab = "all" | "unread";

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

  const markCheckedMutation = useMarkCheckedMutation();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  useEffect(() => {
    if (unreadCount > 0) {
      markCheckedMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifications =
    historyData?.pages.flatMap((p) => p.data ?? []) ?? [];
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

  return {
    t,
    activeTab,
    refreshing,
    unreadCount,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    notifications,
    hasUnread,
    markAllReadMutation,
    queryClient,
    handleNotificationPress,
    handleMarkAllRead,
    handleTabChange,
    handleEndReached,
    handleRefresh,
  };
}
