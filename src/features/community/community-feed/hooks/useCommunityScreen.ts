import { useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";
import { getInfiniteFeedPostsQueryOptions } from "../queries/options";
import { useMarkPostViewedMutation } from "../queries/mutations";

export function useCommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];

  const {
    data: infiniteFeedData,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...getInfiniteFeedPostsQueryOptions(20),
  });

  const { mutateAsync: markPostViewedApi } = useMarkPostViewedMutation();
  const reportedViewedRef = useRef<Set<string>>(new Set());

  const markPostViewed = useCallback(
    (postId: string) => {
      if (reportedViewedRef.current.has(postId)) {
        return;
      }
      reportedViewedRef.current.add(postId);
      markPostViewedApi(postId).catch((err) => {
        console.error("Failed to mark post as viewed:", err);
        reportedViewedRef.current.delete(postId);
      });
    },
    [markPostViewedApi],
  );

  const onRefresh = useCallback(() => {
    reportedViewedRef.current.clear();
    refetch();
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const cardBg = colorScheme === "dark" ? "#1F2A20" : "#FFFFFF";
  const lineColor =
    colorScheme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(47,127,52,0.12)";
  const mutedText = palette.textGray;

  const posts = infiniteFeedData
    ? (() => {
        const seen = new Set<string>();
        return infiniteFeedData.pages
          .flatMap((page) => page.content ?? [])
          .filter((post) => {
            if (seen.has(post.id)) return false;
            seen.add(post.id);
            return true;
          });
      })()
    : [];

  const parsedError = isError ? parseApiError(error) : null;

  const openCommentsModal = (postId: string) => {
    router.push({
      pathname: "/modal",
      params: {
        postId,
      },
    });
  };

  return {
    t,
    router,
    palette,
    isLoading,
    isError,
    isRefetching,
    onRefresh,
    cardBg,
    lineColor,
    mutedText,
    posts,
    parsedError,
    openCommentsModal,
    markPostViewed,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  };
}

