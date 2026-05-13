import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ClipboardList, Globe, Play } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { Pagination } from "@/src/components/ui/Pagination";
import { useFilteredList } from "@/src/hooks/useFilteredList";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import type { PlanResponse, PlanApplyResponse } from "./plan.types";
import { PlanCard } from "./PlanCard";
import { PlanApplyCard } from "./PlanApplyCard";
import { useMyPlans, useMyApplies, usePublicPlans } from "../queries/plan.queries";

const PAGE_SIZE = 20;

type PlanTab = "my" | "applied" | "public";

export function PlanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [activeTab, setActiveTab] = useState<PlanTab>("my");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const pageParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sortBy: "createdAt",
      sortDir: "DESC" as const,
    }),
    [page],
  );

  const myPlansQuery = useMyPlans(pageParams);
  const myAppliesQuery = useMyApplies(pageParams);
  const publicPlansQuery = usePublicPlans(pageParams);

  const getActiveQuery = () => {
    switch (activeTab) {
      case "my":
        return myPlansQuery;
      case "applied":
        return myAppliesQuery;
      case "public":
        return publicPlansQuery;
    }
  };

  const activeQuery = getActiveQuery();
  const itemsCache = activeQuery.data?.content ?? [];

  const searchFields = useCallback(
    () => {
      if (activeTab === "applied") {
        return [
          (p: any) => p.planId,
          (p: any) => p.status,
        ];
      }
      return [
        (p: any) => p.planName,
        (p: any) => p.diseaseName,
      ];
    },
    [activeTab],
  );

  const filteredItems = useFilteredList({
    items: itemsCache,
    searchQuery,
    fields: searchFields(),
  });

  const handleRefresh = () => {
    setPage(0);
    void activeQuery.refetch();
  };

  const handleTabChange = (tab: PlanTab) => {
    setActiveTab(tab);
    setPage(0);
    setSearchQuery("");
  };

  const handlePlanPress = (plan: PlanResponse) => {
    router.push(`/(main)/plans/${plan.id}` as never);
  };

  const handleApplyPress = (apply: PlanApplyResponse) => {
    router.push(`/(main)/plans/apply/${apply.id}` as never);
  };

  // Use plain StyleSheet for tab active state to avoid NativeWind
  // upgrade-warning (shadow-sm toggled dynamically causes View->Pressable
  // upgrade mid-render, which JSON.stringifies props and crashes on
  // NavigationStateContext getters).
  const tabActiveStyle = {
    backgroundColor: isDark ? "#334155" : "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  };

  const ACTIVE_COLOR = "#059669";
  const INACTIVE_COLOR = "#64748b";

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">

      {/* Segmented Control — uses StyleSheet, NOT dynamic className */}
      <View className="bg-white px-4 py-2 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <View className="flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <TouchableOpacity
            onPress={() => handleTabChange("my")}
            style={[styles.tabButton, activeTab === "my" ? tabActiveStyle : undefined]}
          >
            <ClipboardList size={16} color={activeTab === "my" ? ACTIVE_COLOR : INACTIVE_COLOR} />
            <Text
              style={[styles.tabText, { color: activeTab === "my" ? ACTIVE_COLOR : INACTIVE_COLOR }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t("plan.tabs.my", "My Plans")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabChange("applied")}
            style={[styles.tabButton, activeTab === "applied" ? tabActiveStyle : undefined]}
          >
            <Play size={16} color={activeTab === "applied" ? ACTIVE_COLOR : INACTIVE_COLOR} />
            <Text
              style={[styles.tabText, { color: activeTab === "applied" ? ACTIVE_COLOR : INACTIVE_COLOR }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t("plan.tabs.applied", "Applied")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabChange("public")}
            style={[styles.tabButton, activeTab === "public" ? tabActiveStyle : undefined]}
          >
            <Globe size={16} color={activeTab === "public" ? ACTIVE_COLOR : INACTIVE_COLOR} />
            <Text
              style={[styles.tabText, { color: activeTab === "public" ? ACTIVE_COLOR : INACTIVE_COLOR }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t("plan.tabs.public", "Community")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow p-4 pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#10B981"
            colors={["#10B981"]}
          />
        }
      >
        <View className="mb-6 mt-2 flex-row items-center justify-between">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              activeTab === "applied"
                ? t("plan.list.searchAppliedPlaceholder", "Search by ID...")
                : t("plan.list.searchPlaceholder", "Search plans...")
            }
          />
        </View>

        {activeQuery.isLoading && page === 0 ? <LoadingView /> : null}

        {activeQuery.isError && page === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={t("plan.list.loadFailed", "Failed to load list")}
            actionLabel={t("common.retry", "Retry")}
            onAction={() => void activeQuery.refetch()}
          />
        ) : null}

        {!activeQuery.isLoading && !activeQuery.isError && filteredItems.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={
              searchQuery
                ? t("plan.list.emptySearchTitle", "No results found")
                : t("plan.list.emptyTitle", "No data yet")
            }
            subtitle={
              searchQuery
                ? t("plan.list.emptySearchMessage", "Try changing the search keywords")
                : t("plan.list.emptyMessage", "Your data will appear here")
            }
          />
        ) : null}

        {!activeQuery.isError ? (
          <View className="mt-2 flex-col gap-3">
            {filteredItems.map((item: any) => (
              <View key={item.id} className="w-full">
                {activeTab === "applied" ? (
                  <PlanApplyCard apply={item} onPress={handleApplyPress} />
                ) : (
                  <PlanCard plan={item} onPress={handlePlanPress} />
                )}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {activeQuery.isFetching && !activeQuery.isLoading && (
        <View className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 z-50 items-center justify-center bg-slate-900/10 dark:bg-black/20">
          <View className="rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-800">
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        </View>
      )}

      {/* Fixed Pagination Footer */}
      {!activeQuery.isError && (activeQuery.data?.totalPages ?? 0) > 1 ? (
        <View className="bg-white border-t border-slate-200 dark:bg-slate-950 dark:border-slate-800 pb-4">
          <Pagination
            page={page}
            totalPages={activeQuery.data?.totalPages ?? 0}
            totalElements={activeQuery.data?.totalElements}
            onPageChange={setPage}
            itemLabel={
              activeTab === "applied"
                ? t("plan.list.itemAppliedLabel", { defaultValue: "applies" })
                : t("plan.list.itemLabel", { defaultValue: "plans" })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
