import { View, ActivityIndicator } from "react-native";
import { Trees, Map, CalendarDays, AlertTriangle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StatCard } from "./StatCard";
import { homeStyles as styles } from "./home.styles";
import type { AgricultureStatsResponse } from "../api/home.types";

type StatsGridProps = {
  stats: AgricultureStatsResponse | undefined;
  isLoading: boolean;
  primaryColor: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
  isDark: boolean;
};

export function StatsGrid({
  stats,
  isLoading,
  primaryColor,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  isDark,
}: StatsGridProps) {
  const { t } = useTranslation();

  if (isLoading || !stats) {
    return (
      <View style={[styles.statsGrid, { minHeight: 180, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={styles.statsGrid}>
      <StatCard
        icon={<Trees size={20} color={primaryColor} />}
        iconBg={isDark ? "rgba(74,222,128,0.12)" : "rgba(47,127,52,0.1)"}
        label={t("plantManagement.overview.statsPlants", "Plants")}
        value={String(stats.activePlants)}
        badge={`/ ${stats.totalPlants}`}
        badgeColor={primaryColor}
        bg={cardBg}
        borderColor={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
      />
      <StatCard
        icon={<Map size={20} color="#3B82F6" />}
        iconBg="rgba(59,130,246,0.1)"
        label={t("plantManagement.overview.statsFarms", "Farms")}
        value={String(stats.totalFarmPlots)}
        badge={stats.totalFarmZones > 0 ? `${stats.totalFarmZones} zones` : undefined}
        badgeColor="#3B82F6"
        bg={cardBg}
        borderColor={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
      />
      <StatCard
        icon={<CalendarDays size={20} color="#8B5CF6" />}
        iconBg="rgba(139,92,246,0.1)"
        label={t("plantManagement.overview.statsTodayEvents", "Today's Events")}
        value={String(stats.todayEvents)}
        badge={stats.todayCompletedEvents > 0 ? `${stats.todayCompletedEvents} ✓` : undefined}
        badgeColor="#8B5CF6"
        bg={cardBg}
        borderColor={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
      />
      <StatCard
        icon={<AlertTriangle size={20} color="#EF4444" />}
        iconBg="rgba(239,68,68,0.1)"
        label={t("plantManagement.overview.statsOverdue", "Overdue")}
        value={String(stats.overdueEvents)}
        bg={cardBg}
        borderColor={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
      />
    </View>
  );
}
