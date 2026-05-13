import React from "react";
import { View, Text, Pressable } from "react-native";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Play,
  ShieldAlert,
  Users,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import type { CommunityPlanInfo } from "./community.types";

const SEVERITY_BADGE: Record<string, string> = {
  LOW: "bg-green-100 dark:bg-green-900/30",
  MEDIUM: "bg-amber-100 dark:bg-amber-900/30",
  HIGH: "bg-orange-100 dark:bg-orange-900/30",
  CRITICAL: "bg-red-100 dark:bg-red-900/30",
};

const SEVERITY_TEXT: Record<string, string> = {
  LOW: "text-green-700 dark:text-green-400",
  MEDIUM: "text-amber-700 dark:text-amber-400",
  HIGH: "text-orange-700 dark:text-orange-400",
  CRITICAL: "text-red-700 dark:text-red-400",
};

type PlanReferenceCardProps = {
  planId: string;
  planInfo?: CommunityPlanInfo | null;
};

export function PlanReferenceCard({
  planId,
  planInfo,
}: PlanReferenceCardProps) {
  const router = useRouter();

  const title =
    planInfo?.diseaseName ?? planInfo?.planName ?? "Kế hoạch điều trị";
  const severityKey = planInfo?.severityLevel?.toUpperCase() ?? "";
  const severityBadgeClass =
    SEVERITY_BADGE[severityKey] ?? "bg-slate-100 dark:bg-slate-800";
  const severityTextClass =
    SEVERITY_TEXT[severityKey] ?? "text-slate-600 dark:text-slate-400";

  const handlePress = () => {
    router.push({
      pathname: "/(main)/plans/[id]",
      params: { id: planId },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mx-4 mb-3 overflow-hidden rounded-2xl border border-green-200 bg-green-50 active:opacity-80 dark:border-green-800 dark:bg-green-950/40"
    >
      {/* Top accent bar */}
      <View className="h-1 w-full bg-[#245A34] dark:bg-emerald-500" />

      <View className="px-4 py-3">
        {/* Header row */}
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 flex-row items-start gap-2.5">
            <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-xl bg-[#245A34]/10 dark:bg-[#245A34]/30">
              <ClipboardList size={18} color="#245A34" strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-[#245A34] dark:text-emerald-500">
                Kế hoạch điều trị được chia sẻ
              </Text>
              <Text
                className="text-[15px] font-bold leading-snug text-gray-900 dark:text-slate-100"
                numberOfLines={2}
              >
                {title}
              </Text>
            </View>
          </View>
          <View className="mt-1">
            <ChevronRight size={16} color="#245A34" strokeWidth={2.5} />
          </View>
        </View>

        {/* Meta badges row */}
        {planInfo ? (
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            {planInfo.severityLevel && (
              <View className={`rounded-full px-2.5 py-0.5 ${severityBadgeClass}`}>
                <Text className={`text-[11px] font-black ${severityTextClass}`}>
                  {planInfo.severityLevel}
                </Text>
              </View>
            )}
            {planInfo.urgency && (
              <View className="flex-row items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 dark:bg-orange-900/30">
                <ShieldAlert size={12} color="#c2410c" strokeWidth={2.5} />
                <Text className="text-[11px] font-black text-orange-700 dark:text-orange-400">
                  {planInfo.urgency}
                </Text>
              </View>
            )}
            {planInfo.estimatedCost && (
              <View className="flex-row items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 dark:bg-slate-800">
                <DollarSign size={12} color="#475569" strokeWidth={2.5} />
                <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {planInfo.estimatedCost}
                </Text>
              </View>
            )}
            {(planInfo.applyCount ?? 0) > 0 && (
              <View className="flex-row items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 dark:bg-blue-900/30">
                <Users size={12} color="#1d4ed8" strokeWidth={2.5} />
                <Text className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                  {planInfo.applyCount} đã áp dụng
                </Text>
              </View>
            )}
            {(planInfo.eventCount ?? 0) > 0 && (
              <View className="flex-row items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 dark:bg-emerald-900/30">
                <CalendarDays size={12} color="#047857" strokeWidth={2.5} />
                <Text className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {planInfo.eventCount} tác vụ
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Required inputs preview */}
        {planInfo?.requiredInputs && planInfo.requiredInputs.length > 0 && (
          <View className="mt-2.5 flex-row flex-wrap gap-1.5">
            {planInfo.requiredInputs.slice(0, 3).map((inp, i) => (
              <View
                key={i}
                className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 dark:border-slate-700 dark:bg-slate-800"
              >
                <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {inp}
                </Text>
              </View>
            ))}
            {planInfo.requiredInputs.length > 3 && (
              <View className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 dark:border-slate-700 dark:bg-slate-800">
                <Text className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  +{planInfo.requiredInputs.length - 3} khác
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Footer CTA */}
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Bấm để xem chi tiết & áp dụng
          </Text>
          <View className="flex-row items-center gap-1 rounded-xl bg-[#245A34] px-3 py-1 dark:bg-emerald-600">
            <Play size={10} color="#ffffff" strokeWidth={3} fill="#ffffff" />
            <Text className="text-[11px] font-black text-white">Áp dụng</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
