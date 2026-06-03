import { useCallback, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";
import { expertApi } from "../api/expert.api";
import type { ExpertProfile } from "../types/expert.types";

const PAGE_SIZE = 20;

export function useExpertScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];

  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: expertsPage,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["experts", searchTerm],
    queryFn: ({ pageParam }) =>
      expertApi.getExperts(searchTerm || undefined, pageParam as number, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
  });

  const experts = expertsPage?.pages.flatMap((page) => page.content) ?? [];

  const requestConsultMutation = useMutation({
    mutationFn: (expertId: string) => expertApi.requestConsultation(expertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts"] });
    },
  });

  const cancelConsultMutation = useMutation({
    mutationFn: (expertId: string) => expertApi.cancelConsultationRequest(expertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts"] });
    },
  });

  const followMutation = useMutation({
    mutationFn: (profileId: string) => expertApi.followUser(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (profileId: string) => expertApi.unfollowUser(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experts"] });
    },
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const onSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleConsultPress = useCallback(
    (expert: ExpertProfile) => {
      if (expert.hasPendingConsultRequest) {
        cancelConsultMutation.mutate(expert.id);
      } else {
        requestConsultMutation.mutate(expert.id);
      }
    },
    [cancelConsultMutation, requestConsultMutation],
  );

  const handleFollowPress = useCallback(
    (expert: ExpertProfile) => {
      if (expert.isFollowing) {
        unfollowMutation.mutate(expert.id);
      } else {
        followMutation.mutate(expert.id);
      }
    },
    [unfollowMutation, followMutation],
  );

  const handleExpertPress = useCallback(
    (expert: ExpertProfile) => {
      router.push({
        pathname: "/(main)/profile/[profileId]",
        params: { profileId: expert.id, returnTo: "/(main)/experts" },
      });
    },
    [router],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const cardBg = colorScheme === "dark" ? "#1F2A20" : "#FFFFFF";
  const lineColor =
    colorScheme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(47,127,52,0.12)";
  const mutedText = palette.textGray;
  const parsedError = isError ? parseApiError(error) : null;

  const isLoadingConsult = requestConsultMutation.isPending || cancelConsultMutation.isPending;
  const isLoadingFollow = followMutation.isPending || unfollowMutation.isPending;

  return {
    t,
    router,
    palette,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    onRefresh,
    onSearch,
    searchTerm,
    cardBg,
    lineColor,
    mutedText,
    experts,
    parsedError,
    handleConsultPress,
    handleFollowPress,
    handleExpertPress,
    onEndReached,
    isLoadingConsult,
    isLoadingFollow,
  };
}
