import { Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export type PaginationProps = {
  page: number;
  totalPages: number;
  totalElements?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

export function Pagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
  itemLabel = "items",
}: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    if (totalElements !== undefined) {
      return (
        <View className="items-center py-4">
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {totalElements} {itemLabel}
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <View className="flex-row items-center justify-between py-4 px-2">
      <TouchableOpacity
        onPress={() => onPageChange(page - 1)}
        disabled={page === 0}
        className={`flex-row items-center justify-center rounded-xl px-3 py-2 border ${
          page === 0
            ? "border-slate-200 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-900"
            : "border-slate-300 bg-white active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
        }`}
      >
        <ChevronLeft
          size={18}
          color={page === 0 ? "#94a3b8" : "#334155"}
        />
        <Text
          className={`ml-1 text-sm font-semibold ${
            page === 0
              ? "text-slate-400 dark:text-slate-500"
              : "text-slate-700 dark:text-slate-300"
          }`}
        >
          {t("common.previous", { defaultValue: "Trước" })}
        </Text>
      </TouchableOpacity>

      <View className="items-center">
        <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {page + 1} / {totalPages}
        </Text>
        {totalElements !== undefined && (
          <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {totalElements} {itemLabel}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className={`flex-row items-center justify-center rounded-xl px-3 py-2 border ${
          page >= totalPages - 1
            ? "border-slate-200 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-900"
            : "border-slate-300 bg-white active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
        }`}
      >
        <Text
          className={`mr-1 text-sm font-semibold ${
            page >= totalPages - 1
              ? "text-slate-400 dark:text-slate-500"
              : "text-slate-700 dark:text-slate-300"
          }`}
        >
          {t("common.next", { defaultValue: "Sau" })}
        </Text>
        <ChevronRight
          size={18}
          color={page >= totalPages - 1 ? "#94a3b8" : "#334155"}
        />
      </TouchableOpacity>
    </View>
  );
}
