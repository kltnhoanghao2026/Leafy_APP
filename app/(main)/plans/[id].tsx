import { useMemo, useState, useLayoutEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Edit2, Globe, Lock, Play, Trash2, Bot, CheckCircle2, ShieldAlert, FlaskConical, MapPin, Cpu, Sprout, User, UserCheck, BadgeCheck, Clock, DollarSign, AlertTriangle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { usePlanDetail, useUpdatePlanVisibilityMutation, useDeletePlanMutation } from "@/src/features/plan/queries/plan.queries";
import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";
import { usePlantById } from "@/src/features/plant/queries/queries";
import { useFarmPlotById } from "@/src/features/farm/queries/queries";

import { formatDate } from "@/src/utils/date";
import { ApplyPlanSheet } from "@/src/features/plan/components/apply-plan";
import type { PlanStatus } from "@/src/features/plan/components/plan.types";

const STATUS_STYLE: Record<PlanStatus, string> = {
  PENDING:   "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
  APPLYING:  "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
  ACTIVE:    "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
  COMPLETED: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  CANCELLED: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
};

const STATUS_TEXT: Record<PlanStatus, string> = {
  PENDING:   "text-amber-700 dark:text-amber-500",
  APPLYING:  "text-purple-700 dark:text-purple-500",
  ACTIVE:    "text-green-700 dark:text-green-500",
  COMPLETED: "text-blue-700 dark:text-blue-500",
  CANCELLED: "text-red-600 dark:text-red-500",
};

const SEVERITY_STYLE: Record<string, { bg: string, text: string }> = {
  LOW:      { bg: "bg-green-50", text: "text-green-600" },
  MEDIUM:   { bg: "bg-amber-50", text: "text-amber-600" },
  HIGH:     { bg: "bg-orange-50", text: "text-orange-600" },
  CRITICAL: { bg: "bg-red-50", text: "text-red-600" },
};

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafePlanDetailScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlanDetailScreen />
    </SafeAreaView>
  );
}

function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isApplySheetOpen, setIsApplySheetOpen] = useState(false);

  const { data: myProfile } = useQuery(getMyProfileQueryOptions());
  const ownerProfileId = myProfile?.id ?? "";

  const planQuery = usePlanDetail(id);
  const plan = planQuery.data;

  // ── Set header title dynamically from plan name ──
  const navigation = useNavigation();
  useLayoutEffect(() => {
    if (plan) {
      navigation.setOptions({
        headerTitle: plan.planName || plan.diseaseName || t("plan.detail.unnamed", "Kế hoạch điều trị"),
      });
    }
  }, [navigation, plan, t]);


  const updateVisibility = useUpdatePlanVisibilityMutation();
  const deletePlan = useDeletePlanMutation();
  
  const isOwner = !!ownerProfileId && plan && (ownerProfileId === plan.ownerId || ownerProfileId === plan.creatorId);

  const handleDeletePlan = () => {
    Alert.alert(
      t("plan.detail.deleteTitle", "Xóa kế hoạch"),
      t("plan.detail.deleteConfirm", "Bạn có chắc muốn xóa kế hoạch này?"),
      [
        { text: t("common.cancel", "Hủy"), style: "cancel" },
        { 
          text: t("common.delete", "Xóa"), 
          style: "destructive", 
          onPress: async () => {
            if (!plan) return;
            setIsDeleting(true);
            try {
              await deletePlan.mutateAsync(plan.id);
              router.back();
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (planQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (planQuery.isError || !plan) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <Text className="text-center font-bold text-slate-500 mb-4">
          {t("plan.detail.error", "Không tải được kế hoạch")}
        </Text>
        <TouchableOpacity 
          className="rounded-full bg-emerald-600 px-6 py-3"
          onPress={() => planQuery.refetch()}
        >
          <Text className="font-bold text-white">{t("common.retry", "Thử lại")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

    
  const severityStyle = plan.severityLevel ? (SEVERITY_STYLE[plan.severityLevel.toUpperCase()] ?? { bg: "bg-slate-50", text: "text-slate-600" }) : null;
  const confidencePct = plan.confidenceScore != null ? Math.round(plan.confidenceScore * 100) : null;

  const author = plan.creatorInfo || plan.ownerInfo;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* ── Hero Info Section ── */}
      <View className="px-5 pt-6 pb-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className={`rounded-full border px-3 py-1 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700`}>
            <Text className={`text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400`}>
              Bản mẫu Kế hoạch
            </Text>
          </View>
          {plan.urgency && (
            <View className="flex-row items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 dark:bg-orange-900/20 dark:border-orange-800">
              <Clock size={12} color="#c2410c" strokeWidth={2.5} />
              <Text className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-500">{plan.urgency}</Text>
            </View>
          )}
        </View>

        {plan.diseaseName && plan.diseaseName !== plan.planName && (
          <View className="mb-2">
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t("plan.detail.disease", "Bệnh lý")}</Text>
            <View className="flex-row items-center gap-2">
              <FlaskConical size={16} color="#059669" strokeWidth={2.5} />
              <Text className="text-lg font-black text-slate-900 dark:text-white">
                {plan.diseaseName}
              </Text>
            </View>
          </View>
        )}

        <Text className="text-xs font-semibold text-slate-400 mt-2">
          {t("plan.detail.createdAt", "Tạo lúc")} {formatDate(plan.createdAt)}
        </Text>

        {author && (
          <View className="flex-row items-center gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              {author.avatar ? (
                <Image source={{ uri: author.avatar }} className="w-full h-full" />
              ) : (
                <View className="flex-1 items-center justify-center bg-emerald-100 dark:bg-emerald-900">
                  <User size={20} color="#059669" />
                </View>
              )}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                  {author.fullName || t("plan.detail.unknownUser", "Người dùng ẩn danh")}
                </Text>
                {author.isVerified && <BadgeCheck size={14} color="#0ea5e9" />}
              </View>
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400" numberOfLines={1}>
                {author.specialty || author.role || t("plan.detail.member", "Thành viên")}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Action Buttons ── */}
      <View className="px-5 py-4 flex-row gap-3">
        <TouchableOpacity
          onPress={() => setIsApplySheetOpen(true)}
          className="flex-1 flex-row justify-center items-center rounded-2xl bg-emerald-600 px-4 py-3.5 shadow-sm"
        >
          <Play size={18} color="#ffffff" className="mr-2" />
          <Text className="text-sm font-black text-white">{t("plan.detail.apply", "Áp dụng")}</Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            onPress={() => updateVisibility.mutate({ planId: plan.id })}
            className={`flex-1 flex-row justify-center items-center rounded-2xl border px-4 py-3.5 shadow-sm ${
              plan.isPublic
                ? "border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800"
                : "border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700"
            }`}
          >
            {plan.isPublic ? <Globe size={18} color="#1d4ed8" className="mr-2" /> : <Lock size={18} color="#475569" className="mr-2" />}
            <Text className={`text-sm font-black ${plan.isPublic ? "text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"}`}>
              {plan.isPublic ? t("plan.detail.public", "Công khai") : t("plan.detail.private", "Riêng tư")}
            </Text>
          </TouchableOpacity>
        )}

        {isOwner && (
          <TouchableOpacity
            onPress={handleDeletePlan}
            disabled={isDeleting}
            className="flex-row justify-center items-center rounded-2xl border border-red-100 bg-white w-[52px] h-[52px] shadow-sm dark:bg-slate-800 dark:border-red-900/50"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Trash2 size={20} color="#dc2626" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Content Cards ── */}
      <View className="px-5 gap-5 pb-8">
        {plan.question && (
          <View className="flex-row gap-3 rounded-3xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-900/20">
            <Bot size={20} color="#f59e0b" strokeWidth={2} className="mt-0.5" />
            <View className="flex-1">
              <Text className="mb-1 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
                {t("plan.detail.originalQuestion", "Câu hỏi gốc")}
              </Text>
              <Text className="text-sm font-semibold leading-relaxed text-amber-900 dark:text-amber-100">
                {plan.question}
              </Text>
            </View>
          </View>
        )}

        <View className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Text className="mb-4 text-base font-black text-slate-900 dark:text-white">
            {t("plan.detail.keyMetrics", "Thông tin chính")}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            
            
            {confidencePct != null && (
              <View className="flex-1 min-w-[45%] rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("plan.detail.confidence", "Độ tin cậy")}</Text>
                <View className="mt-2">
                  <Text className="mb-1 text-sm font-black text-slate-800 dark:text-slate-200">{confidencePct}%</Text>
                  <View className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <View className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${confidencePct}%` }} />
                  </View>
                </View>
              </View>
            )}

            {plan.severityLevel && severityStyle && (
              <View className={`flex-1 min-w-[45%] rounded-2xl p-4 ${severityStyle.bg} dark:bg-opacity-10`}>
                <Text className={`text-[10px] font-black uppercase tracking-widest ${severityStyle.text} opacity-70`}>{t("plan.detail.severity", "Mức độ")}</Text>
                <Text className={`mt-1 text-sm font-black ${severityStyle.text}`}>{plan.severityLevel}</Text>
              </View>
            )}

            {plan.estimatedCost && (
              <View className="flex-1 min-w-[45%] rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <View className="flex-row items-center gap-1">
                  <DollarSign size={12} color="#94a3b8" strokeWidth={2.5} />
                  <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("plan.detail.cost", "Chi phí")}</Text>
                </View>
                <Text className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{plan.estimatedCost}</Text>
              </View>
            )}
            
            <View className="flex-1 min-w-[45%] rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("plan.detail.eventCount", "Sự kiện (Bản mẫu)")}</Text>
              <Text className="mt-1 text-sm font-black text-slate-800 dark:text-slate-200">{plan.events?.length ?? 0}</Text>
            </View>
          </View>
        </View>

        <View className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 gap-4">
          <Text className="text-base font-black text-slate-900 dark:text-white">
            {t("plan.detail.safetyInputs", "Vật tư & An toàn")}
          </Text>
          
          <View className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <View className="flex-row items-center gap-1.5 mb-2">
              <FlaskConical size={14} color="#94a3b8" strokeWidth={2.5} />
              <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("plan.detail.requiredInputs", "Vật tư cần có")}</Text>
            </View>
            {plan.requiredInputs?.length ? (
              plan.requiredInputs.map((inp, i) => (
                <View key={i} className="flex-row items-start gap-2 mb-1.5">
                  <View className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <Text className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{inp}</Text>
                </View>
              ))
            ) : (
              <Text className="text-sm font-semibold text-slate-400 italic">{t("plan.detail.noData", "Chưa cập nhật")}</Text>
            )}
          </View>

          <View className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/10">
            <View className="flex-row items-center gap-1.5 mb-2">
              <ShieldAlert size={14} color="#f87171" strokeWidth={2.5} />
              <Text className="text-[10px] font-black uppercase tracking-widest text-red-500">{t("plan.detail.safetyWarnings", "Cảnh báo an toàn")}</Text>
            </View>
            {plan.safetyWarnings?.length ? (
              plan.safetyWarnings.map((w, i) => (
                <View key={i} className="flex-row items-start gap-2 mb-1.5">
                  <AlertTriangle size={14} color="#ef4444" className="mt-0.5" strokeWidth={2.5} />
                  <Text className="flex-1 text-sm font-semibold text-red-700 dark:text-red-400">{w}</Text>
                </View>
              ))
            ) : (
              <Text className="text-sm font-semibold text-red-400 italic">{t("plan.detail.checkBeforeApply", "Kiểm tra thực tế trước khi áp dụng.")}</Text>
            )}
          </View>

          <View className="rounded-2xl bg-green-50 p-4 dark:bg-green-900/10">
            <View className="flex-row items-center gap-1.5 mb-2">
              <CheckCircle2 size={14} color="#22c55e" strokeWidth={2.5} />
              <Text className="text-[10px] font-black uppercase tracking-widest text-green-600">{t("plan.detail.successIndicators", "Dấu hiệu thành công")}</Text>
            </View>
            {plan.successIndicators ? (
              <Text className="text-sm font-semibold text-green-800 dark:text-green-400">{plan.successIndicators}</Text>
            ) : (
              <Text className="text-sm font-semibold text-green-400 italic">{t("plan.detail.noData", "Chưa cập nhật")}</Text>
            )}
          </View>
        </View>

        {/* ── Blueprint Events (Template) ── */}
        <View className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <View className="mb-4">
            <Text className="text-base font-black text-slate-900 dark:text-white">
              Lịch trình dự kiến (Bản mẫu)
            </Text>
            <Text className="mt-0.5 text-sm font-semibold text-slate-400">
              Các sự kiện mẫu sẽ được tạo ra khi áp dụng kế hoạch
            </Text>
          </View>
          
          {!plan.events || plan.events.length === 0 ? (
            <Text className="py-6 text-center text-sm font-bold text-slate-400">
              Kế hoạch này chưa có lịch trình dự kiến.
            </Text>
          ) : (
            <View className="gap-3">
              {plan.events.map((evt, idx) => (
                <View key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:bg-slate-800/50 dark:border-slate-700">
                  <View className="flex-row items-start gap-3">
                    <View className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                      <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-black">{idx + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="text-sm font-black text-slate-900 dark:text-white">
                          {evt.eventType}
                        </Text>
                        {evt.daysFromNow != null && (
                          <View className="rounded-full bg-blue-50 px-2 py-0.5 dark:bg-blue-900/30">
                            <Text className="text-[10px] font-black text-blue-600 dark:text-blue-400">
                              Ngày thứ {evt.daysFromNow}
                            </Text>
                          </View>
                        )}
                        {evt.durationDays != null && (
                          <View className="rounded-full bg-slate-200 px-2 py-0.5 dark:bg-slate-700">
                            <Text className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                              Kéo dài {evt.durationDays} ngày
                            </Text>
                          </View>
                        )}
                      </View>
                      {(evt.note || evt.description) && (
                        <Text className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {evt.note || evt.description}
                        </Text>
                      )}
                      {/* Blueprint Tasks */}
                      {evt.tasks && evt.tasks.length > 0 && (
                        <View className="mt-2 pl-1 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                          {evt.tasks.map((task, tIdx) => (
                            <Text key={tIdx} className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
                              • {task.title}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Applications History ── */}
        <View className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <View className="mb-4">
            <Text className="text-base font-black text-slate-900 dark:text-white">
              Các lần áp dụng (Lịch sử)
            </Text>
            <Text className="mt-0.5 text-sm font-semibold text-slate-400">
              Danh sách các lần kế hoạch này được áp dụng
            </Text>
          </View>
          
          {!plan.applies || plan.applies.length === 0 ? (
            <Text className="py-6 text-center text-sm font-bold text-slate-400">
              Kế hoạch này chưa được áp dụng lần nào.
            </Text>
          ) : (
            <View className="gap-3">
              {plan.applies.map((apply) => {
                const sBg = STATUS_STYLE[apply.status] ?? "bg-slate-50 border-slate-200";
                const sTxt = STATUS_TEXT[apply.status] ?? "text-slate-600";
                const sLabel = t(`plan.status.${apply.status}`, apply.status);
                
                return (
                  <TouchableOpacity
                    key={apply.id}
                    onPress={() => router.push(`/plans/apply/${apply.id}`)}
                    className="flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:active:bg-slate-800"
                  >
                    <View className="flex-1 pr-4">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                        {apply.targetName || apply.planName || "Bản áp dụng"}
                      </Text>
                      <Text className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Ngày tạo: {formatDate(apply.createdAt)}
                      </Text>
                    </View>
                    <View className={`rounded-full border px-3 py-1 ${sBg}`}>
                      <Text className={`text-[10px] font-black uppercase tracking-widest ${sTxt}`}>
                        {sLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

      </View>
    </ScrollView>
      
      {isApplySheetOpen && plan && (
        <View className="absolute inset-0 z-50">
          <ApplyPlanSheet
            planId={plan.id}
            planName={plan.planName || plan.diseaseName || plan.id}
            onClose={() => setIsApplySheetOpen(false)}
          />
        </View>
      )}
    </View>
  );
}
