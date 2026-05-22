import { View, Text } from "react-native";
import { CheckCircle2, Clock } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type OverviewCompletionCardProps = {
  completed: number;
  pending: number;
};

export function OverviewCompletionCard({
  completed,
  pending,
}: OverviewCompletionCardProps) {
  const { t } = useTranslation();
  const total = completed + pending;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-black text-slate-900 dark:text-white">
          {t("plantManagement.overview.completionTitle", "Task Completion")}
        </Text>
        <View className="rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-900/30">
          <Text className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 mb-5 overflow-hidden flex-row">
        {total > 0 ? (
          <View 
            className="h-full bg-emerald-500 rounded-full" 
            style={{ width: `${percentage}%` }} 
          />
        ) : null}
      </View>

      {/* Stats row */}
      <View className="flex-row gap-3">
        <View className="flex-1 flex-row items-center rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
          <CheckCircle2 size={18} color="#10B981" strokeWidth={2.5} />
          <View className="ml-3 flex-1">
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t("plantManagement.overview.completedEvents", "Completed")}
            </Text>
            <Text className="text-lg font-black text-slate-800 dark:text-slate-200">
              {completed}
            </Text>
          </View>
        </View>

        <View className="flex-1 flex-row items-center rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
          <Clock size={18} color="#F59E0B" strokeWidth={2.5} />
          <View className="ml-3 flex-1">
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t("plantManagement.overview.pendingEvents", "Pending")}
            </Text>
            <Text className="text-lg font-black text-slate-800 dark:text-slate-200">
              {pending}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
