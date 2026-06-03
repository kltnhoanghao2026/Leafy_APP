import { View, Text } from "react-native";
import { ClipboardList, CheckCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type PlanApplyStatsCardProps = {
  activePlanApplies: number;
  completedPlanApplies: number;
  totalPlans: number;
};

export function PlanApplyStatsCard({
  activePlanApplies,
  completedPlanApplies,
  totalPlans,
}: PlanApplyStatsCardProps) {
  const { t } = useTranslation();

  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-base font-black text-slate-900 dark:text-white">
          {t("plantManagement.overview.planStatsTitle", "Plan Analytics")}
        </Text>
        <View className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
          <Text className="text-[10px] font-black text-slate-500 dark:text-slate-400">
            {t("plantManagement.overview.totalPlans", { count: totalPlans })}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-blue-50/50 p-4 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
          <View className="flex-row items-center mb-2">
            <View className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-900/40">
              <ClipboardList size={14} color="#3B82F6" strokeWidth={3} />
            </View>
            <Text 
              className="ml-2 flex-1 text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400"
              numberOfLines={2}
            >
              {t("plantManagement.overview.activeApplies", "Active")}
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-900 dark:text-white">{activePlanApplies}</Text>
        </View>

        <View className="flex-1 rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30">
          <View className="flex-row items-center mb-2">
            <View className="rounded-full bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
              <CheckCircle size={14} color="#10B981" strokeWidth={3} />
            </View>
            <Text 
              className="ml-2 flex-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
              numberOfLines={2}
            >
              {t("plantManagement.overview.completedApplies", "Completed")}
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-900 dark:text-white">{completedPlanApplies}</Text>
        </View>
      </View>
    </View>
  );
}
