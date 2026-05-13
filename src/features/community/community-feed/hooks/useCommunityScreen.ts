import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";
import { getFeedPostsQueryOptions } from "../queries/options";

export function useCommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];

  const {
    data: feedPage,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useQuery({
    ...getFeedPostsQueryOptions(0, 20),
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const cardBg = colorScheme === "dark" ? "#1F2A20" : "#FFFFFF";
  const lineColor =
    colorScheme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(47,127,52,0.12)";
  const mutedText = palette.textGray;
  const posts = feedPage?.content ?? [];
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
  };
}
