import { Text, TouchableOpacity, View } from "react-native";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Leaf,
  LayoutGrid,
  Loader,
  Play,
  TreePine,
  XCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/src/utils/date";
import type { PlanApplyResponse, PlanStatus } from "./plan.types";

const STATUS_CONFIG: Record<
  PlanStatus,
  { label: string; icon: any; bg: string; text: string; iconColor: string }
> = {
  PENDING: {
    label: "Chờ xử lý",
    icon: CircleDashed,
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-500",
    iconColor: "#d97706",
  },
  APPLYING: {
    label: "Đang áp dụng",
    icon: Loader,
    bg: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    iconColor: "#9333ea",
  },
  ACTIVE: {
    label: "Đang thực hiện",
    icon: Play,
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    iconColor: "#2563eb",
  },
  COMPLETED: {
    label: "Hoàn thành",
    icon: CheckCircle2,
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-500",
    iconColor: "#059669",
  },
  CANCELLED: {
    label: "Đã hủy",
    icon: XCircle,
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-400",
    iconColor: "#64748b",
  },
};

type Props = {
  apply: PlanApplyResponse;
  onPress: (apply: PlanApplyResponse) => void;
};

export function PlanApplyCard({ apply, onPress }: Props) {
  const { t } = useTranslation();

  const cfg = STATUS_CONFIG[apply.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;

  const scopeLabel = apply.targetName || (apply.plantId
    ? t("plan.apply.scopePlant", "Cây cụ thể")
    : apply.farmZoneId
      ? t("plan.apply.scopeZone", "Khu vực")
      : apply.farmPlotId
        ? t("plan.apply.scopePlot", "Vườn")
        : t("plan.apply.scopeUnknown", "Không rõ"));

  const ScopeIcon = apply.plantId
    ? Leaf
    : apply.farmZoneId
      ? LayoutGrid
      : TreePine;

  const scopeId = apply.plantId || apply.farmZoneId || apply.farmPlotId || "—";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(apply)}
      className="mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <View className="flex-row gap-4">
        {/* Left Icon Container */}
        <View
          className={`h-16 w-16 items-center justify-center rounded-2xl ${cfg.bg}`}
        >
          <StatusIcon size={28} color={cfg.iconColor} strokeWidth={2.5} />
        </View>

        {/* Middle Content */}
        <View className="flex-1 justify-center">
          <View className="mb-1 flex-row items-center justify-between">
            <Text
              className="text-lg font-black text-slate-800 dark:text-slate-100 flex-1"
              numberOfLines={1}
            >
              {apply.planName || apply.diseaseName || apply.planId}
            </Text>
            <View className={`rounded-full px-2.5 py-0.5 ${cfg.bg}`}>
              <Text className={`text-[10px] font-black ${cfg.text}`}>
                {cfg.label}
              </Text>
            </View>
          </View>
          
          <Text
            className="mb-3 text-[13px] font-bold text-slate-500 dark:text-slate-400"
            numberOfLines={1}
          >
            {t("plan.apply.appliedAt", "Áp dụng lúc")} {formatDate(apply.createdAt)}
          </Text>

          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2.5">
            <View className="flex-row items-center gap-1.5">
              <ScopeIcon size={14} color="#94a3b8" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {scopeLabel}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <CalendarDays size={14} color="#94a3b8" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {formatDate(apply.startDate)}
              </Text>
            </View>
            {apply.plantEventIds && (
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {apply.plantEventIds.length} {t("plan.apply.events", "sự kiện")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
