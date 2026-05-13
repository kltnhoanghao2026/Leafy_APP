import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import {
  getInfiniteSearchPostsQueryOptions,
  getInfiniteSearchProfilesQueryOptions,
} from "../queries/options";

export type Tab = "posts" | "people";

export function useCommunitySearchScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const bg = isDark ? palette.background : "#FFFFFF";
  const textCol = palette.text;
  const mutedText = palette.textGray;
  const inputBg = isDark ? "#1E293B" : "#F1F5F9";
  const cardBg = isDark ? "#1E293B" : "#F8FAFC";
  const borderCol = isDark ? "#334155" : "#E2E8F0";

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const postsQuery = useInfiniteQuery(
    getInfiniteSearchPostsQueryOptions(debouncedQuery),
  );
  const profilesQuery = useInfiniteQuery(
    getInfiniteSearchProfilesQueryOptions(debouncedQuery),
  );

  const isSearching = Boolean(debouncedQuery);
  const isLoading =
    activeTab === "posts" ? postsQuery.isLoading : profilesQuery.isLoading;
  const isError =
    activeTab === "posts" ? postsQuery.isError : profilesQuery.isError;

  const postResults = postsQuery.data?.pages.flatMap((p) => p.content) ?? [];
  const profileResults =
    profilesQuery.data?.pages.flatMap((p) => p.content) ?? [];

  const totalPostCount = postsQuery.data?.pages[0]?.totalElements;
  const totalProfileCount = profilesQuery.data?.pages[0]?.totalElements;

  return {
    t,
    palette,
    isDark,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    bg,
    textCol,
    mutedText,
    inputBg,
    cardBg,
    borderCol,
    isSearching,
    isLoading,
    isError,
    postsQuery,
    profilesQuery,
    postResults,
    profileResults,
    totalPostCount,
    totalProfileCount,
  };
}
