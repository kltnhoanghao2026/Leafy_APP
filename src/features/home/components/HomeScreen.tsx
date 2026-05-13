import { ScrollView, View, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

import { StatsGrid } from "./StatsGrid";
import { OverviewCompletionCard } from "./OverviewCompletionCard";
import { PlanApplyStatsCard } from "./PlanApplyStatsCard";
import { TodayTasksSection } from "./TodayTasksSection";
import { homeStyles as styles } from "./home.styles";
import { ChatFAB } from "../../chat/components/ChatFAB";
import { useAgricultureStats } from "../queries/home.queries";

export function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const palette = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const cardBg = isDark ? palette.textInputBackground : "#FFFFFF";
  const cardBorder = isDark ? "rgba(74,222,128,0.12)" : "rgba(47,127,52,0.08)";
  const subText = isDark ? "#94A3B8" : "#64748B";

  const { data: stats, isLoading } = useAgricultureStats();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
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
        <StatsGrid
          stats={stats}
          isLoading={isLoading}
          primaryColor={palette.primary}
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={palette.text}
          subTextColor={subText}
          isDark={isDark}
        />
        
        {stats && (
          <>
            <OverviewCompletionCard
              completed={stats.totalCompletedEvents}
              pending={stats.totalPendingEvents}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textColor={palette.text}
              subTextColor={subText}
            />
            
            <PlanApplyStatsCard
              activePlanApplies={stats.activePlanApplies}
              completedPlanApplies={stats.completedPlanApplies}
              totalPlans={stats.totalPlans}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textColor={palette.text}
              subTextColor={subText}
            />
          </>
        )}

        <TodayTasksSection
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={palette.text}
        />
      </ScrollView>
      <ChatFAB />
    </View>
  );
}
