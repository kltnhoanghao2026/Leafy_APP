import { Text, TouchableOpacity, View } from "react-native";
import {
  CalendarDays,
  Leaf,
  LayoutGrid,
  TreePine,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/src/utils/date";
import type { PlanApplyResponse, PlanStatus } from "../schemas/plan.schema";
import { STATUS_ICON_COLOR, STATUS_APPLY_CONFIG } from "./plan.constants";
import { StatusPickerDropdown } from "./ui/StatusPickerDropdown";

type Props = {
  apply: PlanApplyResponse;
  onPress: (apply: PlanApplyResponse) => void;
  onStatusChange?: (applyId: string, status: PlanStatus) => void;
  onCancelApply?: (apply: PlanApplyResponse) => void;
  variant?: "list" | "grid";
};

export function PlanApplyCard({
  apply,
  onPress,
  onStatusChange,
  onCancelApply,
  variant = "list",
}: Props) {
  const { t } = useTranslation();
  const cfg = STATUS_APPLY_CONFIG[apply.status] ?? STATUS_APPLY_CONFIG.PENDING;
  const StatusIcon = cfg.icon;

  const scopeLabel = apply.targetName || (apply.plantId
    ? t("plan.apply.scopePlant")
    : apply.farmZoneId
      ? t("plan.apply.scopeZone")
      : apply.farmPlotId
        ? t("plan.apply.scopePlot")
        : t("plan.apply.scopeUnknown"));

  const ScopeIcon = apply.plantId
    ? Leaf
    : apply.farmZoneId
      ? LayoutGrid
      : TreePine;

  const scopeId = apply.plantId || apply.farmZoneId || apply.farmPlotId || "—";

  if (variant === "grid") {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(apply)}
        className="mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Top accent bar */}
        <View
          className={`h-1.5 w-full ${
            apply.status === "ACTIVE"
              ? "bg-gradient-to-r from-blue-500 to-cyan-400"
              : apply.status === "COMPLETED"
              ? "bg-gradient-to-r from-emerald-500 to-green-400"
              : apply.status === "APPLYING"
              ? "bg-gradient-to-r from-purple-500 to-violet-400"
              : apply.status === "CANCELLED"
              ? "bg-gradient-to-r from-slate-400 to-slate-300"
              : "bg-gradient-to-r from-amber-400 to-yellow-300"
          }`}
        />

        <View className="p-4">
          {/* Header */}
          <View className="mb-3 flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <Text
                className="text-base font-black text-slate-900 dark:text-white"
                numberOfLines={1}
              >
                {apply.planName || apply.diseaseName || apply.planId}
              </Text>
              <Text className="mt-0.5 text-xs font-semibold text-slate-400">
                {t("plan.apply.appliedAt")} {formatDate(apply.createdAt)}
              </Text>
            </View>
            <View className={`shrink-0 rounded-full px-2.5 py-1 ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
              <View className="flex-row items-center gap-1.5">
                <StatusIcon size={12} color={STATUS_ICON_COLOR[apply.status]} strokeWidth={2.5} />
                <Text className={`text-[10px] font-black ${cfg.text}`}>
                  {t(cfg.labelKey)}
                </Text>
              </View>
            </View>
          </View>

          {/* Scope + date grid */}
          <View className="mb-3 flex-row gap-2">
            <View className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
              <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("plan.apply.scope", "Phạm vi")}
              </Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <ScopeIcon size={14} color="#64748b" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300" numberOfLines={1}>
                  {scopeLabel}
                </Text>
              </View>
            </View>
            <View className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
              <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("plan.apply.startDate", "Bắt đầu")}
              </Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <CalendarDays size={14} color="#64748b" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {formatDate(apply.startDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Metrics */}
          <View className="mb-3 flex-row items-center gap-4">
            <Text className="text-xs font-semibold text-slate-400">
              {apply.plantEventIds?.length ?? 0} {t("plan.apply.events")}
            </Text>
            <Text className="flex-1 text-xs font-mono text-slate-500" numberOfLines={1}>
              {scopeId.slice(0, 8)}…
            </Text>
          </View>

          {/* Status change */}
          {onStatusChange && (
            <View className="mb-2 border-t border-slate-100 pt-3 dark:border-slate-700">
              <Text className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-400">
                {t("plan.apply.changeStatus", "Đổi trạng thái")}
              </Text>
              <StatusPickerDropdown
                applyId={apply.id}
                currentStatus={apply.status}
                onChange={onStatusChange}
              />
            </View>
          )}

          {/* Cancel button — only for ACTIVE applies */}
          {onCancelApply && apply.status === "ACTIVE" && apply.canCancel !== false && (
            <TouchableOpacity
              onPress={() => onCancelApply(apply)}
              className="mt-2 flex-row items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2.5 dark:border-amber-900/50 dark:bg-amber-900/20"
            >
              <X size={14} color="#d97706" strokeWidth={2.5} />
              <Text className="text-xs font-bold text-amber-700 dark:text-amber-500">
                {t("plan.apply.cancelTitle", "Hủy áp dụng")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // ── List variant ─────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(apply)}
      className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <View className="flex-row gap-4">
        {/* Status icon */}
        <View className={`h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
          <StatusIcon size={24} color={STATUS_ICON_COLOR[apply.status]} strokeWidth={2.5} />
        </View>

        {/* Info */}
        <View className="min-w-0 flex-1 justify-center">
          <View className="mb-1 flex-row items-center flex-wrap gap-2">
            <Text
              className="flex-1 text-base font-black text-slate-900 dark:text-white"
              numberOfLines={1}
            >
              {apply.planName || apply.diseaseName || apply.planId}
            </Text>
            <View className={`shrink-0 rounded-full px-2.5 py-0.5 ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
              <Text className={`text-[10px] font-black ${cfg.text}`}>
                {t(cfg.labelKey)}
              </Text>
            </View>
          </View>

          <Text className="text-xs font-semibold text-slate-400">
            {t("plan.apply.appliedAt")} {formatDate(apply.createdAt)}
          </Text>

          <View className="mt-2 flex-row flex-wrap items-center gap-3">
            <View className="flex-row items-center gap-1.5">
              <ScopeIcon size={12} color="#94a3b8" strokeWidth={2.5} />
              <Text className="text-xs font-semibold text-slate-500">{scopeLabel}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <CalendarDays size={12} color="#94a3b8" strokeWidth={2.5} />
              <Text className="text-xs font-semibold text-slate-500">
                {formatDate(apply.startDate)}
              </Text>
            </View>
            {apply.plantEventIds && (
              <Text className="text-xs font-semibold text-slate-500">
                {apply.plantEventIds.length} {t("plan.apply.events")}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Status change + cancel row */}
      {(onStatusChange || (onCancelApply && apply.status === "ACTIVE" && apply.canCancel !== false)) && (
        <View className="mt-3 flex-row items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
          {onStatusChange && (
            <StatusPickerDropdown
              applyId={apply.id}
              currentStatus={apply.status}
              onChange={onStatusChange}
              compact
            />
          )}
          {onCancelApply && apply.status === "ACTIVE" && apply.canCancel !== false && (
            <TouchableOpacity
              onPress={() => onCancelApply(apply)}
              className="ml-auto flex-row items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-900/50 dark:bg-amber-900/20"
            >
              <X size={12} color="#d97706" strokeWidth={2.5} />
              <Text className="text-xs font-bold text-amber-700 dark:text-amber-500">
                {t("plan.apply.cancelTitle", "Hủy")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
