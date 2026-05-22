import { View, ActivityIndicator } from "react-native";
import { Trees, Map, CalendarDays, AlertTriangle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StatCard } from "./StatCard";
import type { AgricultureStatsResponse } from "../api/home.types";

type StatsGridProps = {
  stats: AgricultureStatsResponse | undefined;
  isLoading: boolean;
};

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const { t } = useTranslation();

  if (isLoading || !stats) {
    return (
      <View className="min-h-[180px] justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View className="px-5 flex-row flex-wrap justify-between">
      <View className="w-[48%] mb-4">
        <StatCard
          icon={<Trees size={22} color="#059669" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          label={t("plantManagement.overview.statsPlants", "Plants")}
          value={String(stats.activePlants)}
          badge={`/ ${stats.totalPlants}`}
          badgeColor="text-emerald-600 dark:text-emerald-500"
        />
      </View>
      <View className="w-[48%] mb-4">
        <StatCard
          icon={<Map size={22} color="#3B82F6" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          label={t("plantManagement.overview.statsFarms", "Farms")}
          value={String(stats.totalFarmPlots)}
          badge={stats.totalFarmZones > 0 ? t("plantManagement.overview.zones", { count: stats.totalFarmZones, defaultValue: "{{count}} zones" }) : undefined}
          badgeColor="text-blue-500"
        />
      </View>
      <View className="w-[48%] mb-4">
        <StatCard
          icon={<CalendarDays size={22} color="#8B5CF6" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          label={t("plantManagement.overview.statsTodayEvents", "Today's Events")}
          value={String(stats.todayEvents)}
          badge={stats.todayCompletedEvents > 0 ? `${stats.todayCompletedEvents} ✓` : undefined}
          badgeColor="text-purple-500"
        />
      </View>
      <View className="w-[48%] mb-4">
        <StatCard
          icon={<AlertTriangle size={22} color="#EF4444" />}
          iconBg="bg-red-100 dark:bg-red-900/30"
          label={t("plantManagement.overview.statsOverdue", "Overdue")}
          value={String(stats.overdueEvents)}
        />
      </View>
    </View>
  );
}
