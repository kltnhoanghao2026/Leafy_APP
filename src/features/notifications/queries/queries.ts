import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { notificationApi } from "../api/notification.api";
import { notificationKeys } from "./keys";

/** Polls unread count + lastCheckedAt. Active once user is logged in. */
export const useNotificationState = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.state(),
    queryFn: () => notificationApi.getState(),
    staleTime: 30_000,
    enabled,
  });

/**
 * Cursor-based infinite scroll for the notification list.
 * `enabled` defaults to true so the first page pre-fetches in the background.
 */
export const useNotificationHistory = (unreadOnly = false, enabled = true) =>
  useInfiniteQuery({
    queryKey: notificationKeys.history(unreadOnly),
    queryFn: async ({ pageParam }) => {
      if (unreadOnly) {
        return notificationApi.getUnreadHistory({
          cursor: pageParam as string | undefined,
        });
      }
      return notificationApi.getHistory({
        cursor: pageParam as string | undefined,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const items = lastPage.data;
      // Backend returns `limit` items (default 20) — if fewer, no more pages
      if (!items || items.length < 20) return undefined;
      return items[items.length - 1].occurredAt; // ISO-8601 cursor
    },
    staleTime: 30_000,
    enabled,
  });
