import { Text, TouchableOpacity, View } from "react-native";
import { Check, ClipboardList, Activity, ActivitySquare, BrainCircuit, Globe, Lock } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/src/utils/date";
import type { PlanResponse } from "./plan.types";

type Props = {
  plan: PlanResponse;
  onPress: (plan: PlanResponse) => void;
  selected?: boolean;
  onToggleSelect?: (planId: string) => void;
  selectionMode?: boolean;
  viewMode?: "list" | "grid";
};

export function PlanCard({
  plan,
  onPress,
  selected = false,
  onToggleSelect,
  selectionMode = false,
  viewMode = "list",
}: Props) {
  const { t } = useTranslation();

  const handlePress = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(plan.id);
    } else {
      onPress(plan);
    }
  };

  const handleLongPress = () => {
    if (onToggleSelect) {
      onToggleSelect(plan.id);
    }
  };

  const planName = plan.planName || plan.diseaseName || t("plan.card.unnamed", "Kế hoạch không tên");

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      className={`mb-4 overflow-hidden rounded-3xl border p-4 shadow-sm ${
        selected
          ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/20"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <View className="flex-row gap-4">
        {/* Left Icon Container */}
        <View
          className={`h-16 w-16 items-center justify-center rounded-2xl ${
            selected
              ? "bg-emerald-500"
              : plan.ragPlanId
              ? "bg-blue-50 dark:bg-blue-900/30"
              : "bg-emerald-50 dark:bg-emerald-900/30"
          }`}
        >
          {selected ? (
            <Check size={28} color="#fff" strokeWidth={3} />
          ) : plan.ragPlanId ? (
            <BrainCircuit
              size={28}
              color="#2563eb"
              strokeWidth={2.5}
            />
          ) : (
            <ClipboardList
              size={28}
              color="#059669"
              strokeWidth={2.5}
            />
          )}
        </View>

        {/* Middle Content */}
        <View className="flex-1 justify-center">
          <View className="mb-1 flex-row items-center justify-between">
            <Text
              className="text-lg font-black text-slate-800 dark:text-slate-100 flex-1"
              numberOfLines={1}
            >
              {planName}
            </Text>
            {plan.isPublic ? (
              <View className="ml-2">
                <Globe size={16} color="#3b82f6" />
              </View>
            ) : (
              <View className="ml-2">
                <Lock size={16} color="#94a3b8" />
              </View>
            )}
          </View>
          
          <Text
            className="mb-3 text-[13px] font-bold text-slate-500 dark:text-slate-400"
            numberOfLines={1}
          >
            {plan.diseaseName || t("plan.card.noDisease", "Không rõ bệnh")}
          </Text>

          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2.5">
            {plan.creatorInfo?.fullName && (
              <View className="flex-row items-center gap-1.5 w-full">
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t("plan.card.by", "Bởi")} <Text className="text-slate-700 dark:text-slate-300 font-bold">{plan.creatorInfo.fullName}</Text>
                </Text>
              </View>
            )}
            {plan.confidenceScore !== null && plan.confidenceScore !== undefined && (
              <View className="flex-row items-center gap-1.5">
                <ActivitySquare size={14} color="#60a5fa" />
                <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(plan.confidenceScore * 100)}%
                </Text>
              </View>
            )}
            <View className="flex-row items-center gap-1.5">
              <Activity size={14} color="#94a3b8" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {plan.applyCount || 0} {t("plan.card.applies", "lượt áp dụng")}
              </Text>
            </View>
            {plan.createdAt && (
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {formatDate(plan.createdAt)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
