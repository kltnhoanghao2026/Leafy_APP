import { TouchableOpacity, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react-native";
import type { PlanApplyResponse } from "../../schemas/plan.schema";

type Props = {
  apply: PlanApplyResponse;
  isCancelling: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelApplyDialog({
  apply,
  isCancelling,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/50 p-6">
      <View className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <View className="mb-4 flex-row items-center gap-3">
          <View className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle size={20} color="#d97706" strokeWidth={2.5} />
          </View>
          <Text className="text-lg font-black text-slate-900 dark:text-white">
            {t("plan.apply.cancelTitle")}
          </Text>
        </View>

        <Text className="text-sm font-semibold text-slate-500">
          {t("plan.apply.cancelConfirm")}
        </Text>

        <View className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
          <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {t("plan.apply.cancelWarning")}
          </Text>
        </View>

        <View className="mt-5 flex-row justify-end gap-3">
          <TouchableOpacity
            onPress={onClose}
            disabled={isCancelling}
            className="rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700"
          >
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={isCancelling}
            className="rounded-xl bg-amber-600 px-4 py-2.5 disabled:opacity-50"
          >
            <Text className="text-sm font-bold text-white">
              {isCancelling ? t("plan.apply.cancelling") : t("plan.apply.confirmCancel")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
