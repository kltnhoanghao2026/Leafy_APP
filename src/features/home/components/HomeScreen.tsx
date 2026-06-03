import { ScrollView, View, RefreshControl, Text } from "react-native";
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react-native";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

import { StatsGrid } from "./StatsGrid";
import { OverviewCompletionCard } from "./OverviewCompletionCard";
import { PlanApplyStatsCard } from "./PlanApplyStatsCard";
import { TodayTasksSection } from "./TodayTasksSection";
import { ChatFAB } from "../../chat/components/ChatFAB";
import { useAgricultureStats } from "../queries/home.queries";

export function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const palette = Colors[colorScheme];
  const { t } = useTranslation();

  const { data: stats, isLoading } = useAgricultureStats();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        }
      >
        {/* Modern Header / Greeting Area */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">
                {t("plantManagement.overview.welcomeTitle", "Dashboard")}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white">
                {t("plantManagement.overview.appTitle", "Leafy Overview")}
              </Text>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <Sparkles size={20} color="#059669" />
            </View>
          </View>
        </View>

        <StatsGrid stats={stats} isLoading={isLoading} />
        
        {stats && (
          <View className="px-5 mt-2 flex-col gap-6">
            <OverviewCompletionCard
              completed={stats.totalCompletedEvents}
              pending={stats.totalPendingEvents}
            />
            
            <PlanApplyStatsCard
              activePlanApplies={stats.activePlanApplies}
              completedPlanApplies={stats.completedPlanApplies}
              totalPlans={stats.totalPlans}
            />
          </View>
        )}

        <View className="mt-6">
          <TodayTasksSection />
        </View>
      </ScrollView>
      <ChatFAB />
    </View>
  );
}
