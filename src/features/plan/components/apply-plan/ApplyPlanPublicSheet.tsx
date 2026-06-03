import { Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Play, X } from "lucide-react-native";
import type { PlanResponse } from "../../schemas/plan.schema";

type Props = {
  plan: PlanResponse;
  onClose: () => void;
};

export function ApplyPlanPublicSheet({ plan, onClose }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/50 p-6">
      <View className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-black text-slate-900 dark:text-white">
            {t("plan.apply.title", "Áp dụng kế hoạch")}
          </Text>
          <TouchableOpacity onPress={onClose} className="rounded-full p-1">
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-semibold text-slate-500">
          Bạn muốn áp dụng kế hoạch này vào cây trồng hoặc lô đất của mình?
        </Text>

        <View className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <Text className="text-sm font-black text-slate-900 dark:text-white">
            {plan.planName || plan.diseaseName || t("plan.card.unnamed")}
          </Text>
          {plan.diseaseName && (
            <Text className="mt-0.5 text-xs font-semibold text-slate-500">
              {plan.diseaseName}
            </Text>
          )}
        </View>

        <View className="mt-5 flex-row justify-end gap-3">
          <TouchableOpacity
            onPress={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700"
          >
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              onClose();
              try {
                router.push(`/plans/${plan.id}` as never);
              } catch {
                // Navigation context may not be available during initial render
              }
            }}
            className="flex-row items-center rounded-xl bg-emerald-600 px-4 py-2.5"
          >
            <Play size={16} color="#ffffff" className="mr-1.5" strokeWidth={2.5} />
            <Text className="text-sm font-bold text-white">
              {t("plan.detail.apply", "Áp dụng")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
