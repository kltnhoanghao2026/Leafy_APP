import { Text, TouchableOpacity, View } from "react-native";
import {
  BarChart2,
  Bot,
  ClipboardList,
  DollarSign,
  Globe,
  Lock,
  MapPin,
  Play,
  Sprout,
  Trash2,
  User,
  UserCheck,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/src/utils/date";
import type { PlanResponse, PlanSourceType } from "../schemas/plan.schema";
import {
  SEVERITY_STYLE,
  SOURCE_STYLE,
  SOURCE_ICON_COLOR,
} from "./plan.constants";
import { SelectCheckbox } from "./ui/SelectCheckbox";

type Props = {
  plan: PlanResponse;
  onPress: (plan: PlanResponse) => void;
  selected?: boolean;
  onToggleSelect?: (planId: string) => void;
  onDelete?: (plan: PlanResponse) => void;
  onApply?: (plan: PlanResponse) => void;
  variant?: "list" | "grid";
  /** When true, shows owner info and hides delete/select controls */
  isPublicView?: boolean;
};

export function PlanCard({
  plan,
  onPress,
  selected = false,
  onToggleSelect,
  onDelete,
  onApply,
  variant = "list",
  isPublicView = false,
}: Props) {
  const { t } = useTranslation();

  const planName = plan.planName || plan.diseaseName || t("plan.card.unnamed");
  const severity = plan.severityLevel?.toUpperCase() ?? "";
  const severityStyle = SEVERITY_STYLE[severity];
  const sourceStyle = plan.sourceType ? SOURCE_STYLE[plan.sourceType] : null;

  const handlePress = () => {
    onPress(plan);
  };

  const handleLongPress = () => {
    if (onToggleSelect) {
      onToggleSelect(plan.id);
    }
  };

  if (variant === "grid") {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        className={`mb-4 w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 ${
          selected ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600/20 dark:bg-emerald-900/10" : "border-slate-200"
        }`}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between gap-3 p-5 pb-3">
          {!isPublicView && onToggleSelect && (
            <SelectCheckbox checked={selected} onClick={() => onToggleSelect(plan.id)} />
          )}
          <View className="min-w-0 flex-1">
            <Text
              className="text-base font-black text-slate-900 dark:text-white"
              numberOfLines={2}
            >
              {planName}
            </Text>
            {plan.planName && plan.diseaseName && (
              <Text className="mt-0.5 truncate text-xs font-semibold text-slate-500" numberOfLines={1}>
                {plan.diseaseName}
              </Text>
            )}
            <Text className="mt-1 line-clamp-1 text-xs font-semibold text-slate-400" numberOfLines={1}>
              {plan.successIndicators || t("plan.card.aiDisclaimer")}
            </Text>

            {/* Source type badge */}
            {sourceStyle && (
              <View className={`mt-1.5 flex-row items-center gap-1.5 rounded-full px-2.5 py-1 self-start ${sourceStyle.badge}`}>
                {plan.sourceType === "CONSULTED" ? (
                  <UserCheck size={12} color={SOURCE_ICON_COLOR["CONSULTED"]} strokeWidth={2.5} />
                ) : plan.sourceType === "RAG_GEN" ? (
                  <Bot size={12} color={SOURCE_ICON_COLOR["RAG_GEN"]} strokeWidth={2.5} />
                ) : null}
                <Text className={`text-[10px] font-black ${sourceStyle.text}`}>
                  {t(sourceStyle.labelKey)}
                </Text>
              </View>
            )}

            {/* Public/Owner badge */}
            {isPublicView && plan.ownerInfo && (
              <View className="mt-1.5 flex-row items-center gap-1.5">
                <Globe size={12} color="#3b82f6" strokeWidth={2.5} />
                <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {plan.ownerInfo.fullName || t("plan.card.expert", "Nông dân")}
                </Text>
              </View>
            )}
          </View>

          {/* Apply count badge */}
          <View className={`shrink-0 rounded-full px-2.5 py-1 ring-1 ${
            (plan.applyCount ?? 0) > 0
              ? "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800"
              : "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
          }`}>
            <Text className={`text-[10px] font-black ${
              (plan.applyCount ?? 0) > 0
                ? "text-blue-700 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400"
            }`}>
              {(plan.applyCount ?? 0) > 0
                ? `${plan.applyCount} áp dụng`
                : "Chưa áp dụng"}
            </Text>
          </View>
        </View>

        <View className="mx-5 border-t border-slate-100 dark:border-slate-800" />

        {/* Meta grid */}
        <View className="grid grid-cols-2 gap-3 p-5">
          {/* Severity */}
          {severityStyle && (
            <View className="flex-row items-start gap-2">
              <BarChart2 size={14} color="#94a3b8" strokeWidth={2.5} className="mt-0.5 shrink-0" />
              <View className="min-w-0 flex-1">
                <Text className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  {t("plan.card.severity")}
                </Text>
                <Text className={`mt-0.5 truncate text-xs font-bold ${severityStyle.text}`}>
                  {t(`plan.card.${severity.toLowerCase()}`, severity)}
                </Text>
              </View>
            </View>
          )}

          {/* Cost */}
          <View className="flex-row items-start gap-2">
            <DollarSign size={14} color="#94a3b8" strokeWidth={2.5} className="mt-0.5 shrink-0" />
            <View className="min-w-0 flex-1">
              <Text className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                {t("plan.card.cost")}
              </Text>
              <Text className="mt-0.5 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                {plan.estimatedCost || "—"}
              </Text>
            </View>
          </View>

          {/* Creator */}
          {plan.creatorInfo?.fullName && (
            <View className="flex-row items-start gap-2">
              <User size={14} color="#94a3b8" strokeWidth={2.5} className="mt-0.5 shrink-0" />
              <View className="min-w-0 flex-1">
                <Text className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  {t("plan.card.by", "Bởi")}
                </Text>
                <Text className="mt-0.5 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                  {plan.creatorInfo.fullName}
                </Text>
              </View>
            </View>
          )}

          {/* Confidence score */}
          {plan.confidenceScore != null && (
            <View className="flex-row items-start gap-2">
              <BarChart2 size={14} color="#60a5fa" strokeWidth={2.5} className="mt-0.5 shrink-0" />
              <View className="min-w-0 flex-1">
                <Text className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  {t("plan.detail.confidence", "Độ tin cậy")}
                </Text>
                <Text className="mt-0.5 truncate text-xs font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(plan.confidenceScore * 100)}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Action bar */}
        <View className="mt-auto flex-row items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          {isPublicView && onApply ? (
            <TouchableOpacity
              onPress={() => onApply(plan)}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-emerald-600 py-2"
            >
              <Play size={14} color="#059669" strokeWidth={2.5} />
              <Text className="text-xs font-bold text-emerald-700">
                {t("plan.detail.apply", "Áp dụng")}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handlePress}
              className="flex-1 items-center justify-center rounded-xl bg-emerald-600 py-2"
            >
              <Text className="text-xs font-bold text-white">
                {t("plan.detail.apply", "Áp dụng")}
              </Text>
            </TouchableOpacity>
          )}

          <Text className="ml-2 flex-1 text-xs text-slate-400">
            {formatDate(plan.lastModifiedAt || plan.createdAt)}
          </Text>

          {!isPublicView && onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(plan)}
              className="ml-auto flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2 dark:border-red-900/50 dark:bg-red-900/20"
            >
              <Trash2 size={14} color="#dc2626" strokeWidth={2.5} />
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
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      className={`mb-3 flex-row items-center gap-3 overflow-hidden rounded-2xl border bg-white px-4 py-3 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 ${
        selected ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600/20 dark:bg-emerald-900/10" : "border-slate-200"
      }`}
    >
      {!isPublicView && onToggleSelect && (
        <SelectCheckbox checked={selected} onClick={() => onToggleSelect(plan.id)} />
      )}

      {/* Apply count badge */}
      <View className={`shrink-0 rounded-full px-2 py-0.5 ring-1 hidden sm:flex ${
        (plan.applyCount ?? 0) > 0
          ? "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800"
          : "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
      }`}>
        <Text className={`text-[10px] font-black ${
          (plan.applyCount ?? 0) > 0
            ? "text-blue-700 dark:text-blue-400"
            : "text-slate-500 dark:text-slate-400"
        }`}>
          {(plan.applyCount ?? 0) > 0 ? `${plan.applyCount} áp dụng` : "Chưa áp dụng"}
        </Text>
      </View>

      {/* Name / question */}
      <View className="min-w-0 flex-1">
        <Text
          className="text-sm font-black text-slate-900 dark:text-white"
          numberOfLines={1}
        >
          {plan.diseaseName || planName}
        </Text>
        <Text className="mt-0.5 truncate text-xs font-semibold text-slate-400" numberOfLines={1}>
          {plan.successIndicators || "—"}
        </Text>

        {/* Source type */}
        {sourceStyle && (
          <View className={`mt-1 flex-row items-center gap-1.5 self-start rounded-full px-2 py-0.5 ${sourceStyle.badge}`}>
            {plan.sourceType === "CONSULTED" ? (
              <UserCheck size={10} color={SOURCE_ICON_COLOR["CONSULTED"]} strokeWidth={2.5} />
            ) : plan.sourceType === "RAG_GEN" ? (
              <Bot size={10} color={SOURCE_ICON_COLOR["RAG_GEN"]} strokeWidth={2.5} />
            ) : null}
            <Text className={`text-[10px] font-bold ${sourceStyle.text}`}>
              {t(sourceStyle.labelKey)}
            </Text>
          </View>
        )}

        {/* Public owner */}
        {isPublicView && plan.ownerInfo && (
          <View className="mt-1 flex-row items-center gap-1.5">
            <Globe size={10} color="#3b82f6" strokeWidth={2.5} />
            <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {plan.ownerInfo.fullName || "Nông dân"}
            </Text>
          </View>
        )}
      </View>

      {/* Severity badge — hidden on small screens */}
      {severityStyle ? (
        <View className={`shrink-0 hidden rounded-full px-2 py-0.5 md:flex ${severityStyle.badge}`}>
          <Text className={`text-[10px] font-black ${severityStyle.text}`}>
            {t(`plan.card.${severity.toLowerCase()}`, severity)}
          </Text>
        </View>
      ) : null}

      {/* Date */}
      <Text className="hidden shrink-0 text-xs font-semibold text-slate-400 lg:block">
        {formatDate(plan.createdAt)}
      </Text>

      {/* Actions */}
      <View className="shrink-0 flex-row items-center gap-2">
        {isPublicView && onApply ? (
          <TouchableOpacity
            onPress={() => onApply(plan)}
            className="flex-row items-center gap-1 rounded-xl border border-emerald-600 px-3 py-1.5"
          >
            <Play size={12} color="#059669" strokeWidth={2.5} />
            <Text className="text-xs font-bold text-emerald-700">Áp dụng</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handlePress}
            className="items-center justify-center rounded-xl bg-emerald-600 px-3 py-1.5"
          >
            <Text className="text-xs font-bold text-white">
              {t("plan.detail.apply", "Áp dụng")}
            </Text>
          </TouchableOpacity>
        )}

        {!isPublicView && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(plan)}
            className="items-center justify-center rounded-xl border border-red-100 bg-red-50 p-1.5 dark:border-red-900/50 dark:bg-red-900/20"
          >
            <Trash2 size={14} color="#dc2626" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
