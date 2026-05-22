import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { PlanStatus } from "../../schemas/plan.schema";
import { ALL_STATUSES } from "../plan.constants";

type Props = {
  applyId: string;
  currentStatus: PlanStatus;
  onChange: (applyId: string, status: PlanStatus) => void;
  compact?: boolean;
};

export function StatusPickerDropdown({
  applyId,
  currentStatus,
  onChange,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
      >
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {t(`plan.status.${currentStatus}`)}
          </Text>
          <View className={`transform transition-transform ${open ? "rotate-180" : ""}`}>
            <View className="h-0 w-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-slate-400" />
          </View>
        </View>
        {open && (
          <View className="absolute left-0 top-full z-10 mt-1 min-w-[120px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {ALL_STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  onChange(applyId, s);
                  setOpen(false);
                }}
                className={`px-3 py-1.5 ${s === currentStatus ? "bg-slate-100 dark:bg-slate-700" : ""}`}
              >
                <Text className={`text-xs font-bold ${s === currentStatus ? "text-emerald-600" : "text-slate-600 dark:text-slate-300"}`}>
                  {t(`plan.status.${s}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => setOpen(!open)}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {t(`plan.status.${currentStatus}`)}
        </Text>
        <View className={`transform transition-transform ${open ? "rotate-180" : ""}`}>
          <View className="h-0 w-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-slate-400" />
        </View>
      </View>
      {open && (
        <View className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {ALL_STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => {
                onChange(applyId, s);
                setOpen(false);
              }}
              className={`px-3 py-2 ${s === currentStatus ? "bg-slate-100 dark:bg-slate-700" : ""}`}
            >
              <Text className={`text-xs font-bold ${s === currentStatus ? "text-emerald-600" : "text-slate-600 dark:text-slate-300"}`}>
                {t(`plan.status.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}
