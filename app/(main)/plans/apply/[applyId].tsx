import { useLayoutEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Play,
  Sprout,
  Target,
  XCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { vi as viDate, enUS as enDate } from "date-fns/locale";
import { LocaleConfig } from "react-native-calendars";

import { usePlanApplyDetail, useUpdateApplyStatusMutation, useCancelApplyMutation } from "@/src/features/plan/queries/plan.queries";
import { usePlantEventsByPlanApply } from "@/src/features/plant-event/queries/queries";
import { useUpdatePlantEventMutation, useToggleTaskMutation } from "@/src/features/plant-event/queries/mutations";
import { usePlantById } from "@/src/features/plant/queries/queries";
import { useFarmPlotById } from "@/src/features/farm/queries/queries";

import { formatDate } from "@/src/utils/date";
import type { PlanStatus } from "@/src/features/plan/schemas/plan.schema";
import type { PlantEventResponse } from "@/src/features/plant-event/components/plant-event.types";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import Colors from "@/src/constants/Colors";
import { CalendarMonthView } from "@/src/features/shared/components/CalendarMonthView";
import { EventGroupedList } from "@/src/features/shared/components/EventGroupedList";

LocaleConfig.locales["vi"] = {
  monthNames: ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"],
  monthNamesShort: ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"],
  dayNames: ["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"],
  dayNamesShort: ["CN","T2","T3","T4","T5","T6","T7"],
  today: "Hôm nay",
};
LocaleConfig.locales["en"] = {
  monthNames: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  monthNamesShort: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  dayNames: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  dayNamesShort: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  today: "Today",
};

const STATUS_STYLE: Record<PlanStatus, string> = {
  PENDING:   "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-amber-700 dark:text-amber-500",
  APPLYING:  "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 text-purple-700 dark:text-purple-500",
  ACTIVE:    "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-500",
  COMPLETED: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-700 dark:text-blue-500",
  CANCELLED: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-600 dark:text-red-500",
};

export default function ApplyDetailScreen() {
  const { applyId } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const dateFnsLocale = i18n.language.startsWith("vi") ? viDate : enDate;
  LocaleConfig.defaultLocale = i18n.language.startsWith("vi") ? "vi" : "en";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const applyQuery = usePlanApplyDetail(applyId as string);
  const apply = applyQuery.data;

  const eventsQuery = usePlantEventsByPlanApply(applyId as string, { page: 0, size: 100 });
  const rawEvents = eventsQuery.data?.content;
  const events: PlantEventResponse[] = Array.isArray(rawEvents) ? rawEvents : [];

  const updateEvent = useUpdatePlantEventMutation();
  const toggleTask = useToggleTaskMutation();
  const updateApplyStatus = useUpdateApplyStatusMutation();
  const cancelApply = useCancelApplyMutation();

  const plantQuery = usePlantById(apply?.plantId || "");
  const plotQuery = useFarmPlotById(apply?.farmPlotId || "");

  if (applyQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (applyQuery.isError || !apply) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top', 'left', 'right']}>
        <View className="px-4 pt-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push("/(main)/plans")} className="mr-3 p-1 rounded-full bg-slate-100 dark:bg-slate-800">
            <ChevronLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-slate-700 dark:text-slate-300">Chi tiết áp dụng</Text>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center font-bold text-slate-500 mb-4">Không tải được thông tin áp dụng</Text>
          <TouchableOpacity className="rounded-full bg-emerald-600 px-6 py-3" onPress={() => applyQuery.refetch()}>
            <Text className="font-bold text-white">Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sStyle = STATUS_STYLE[apply.status] ?? "bg-slate-50 border-slate-200 text-slate-600";
  const statusLabel = t(`plan.status.${apply.status}`, apply.status);

  const handleCancel = () => {
    Alert.alert(
      t("plan.apply.cancelTitle", "Hủy áp dụng"),
      t("plan.apply.cancelConfirm", "Bạn có chắc muốn hủy áp dụng kế hoạch này?"),
      [
        { text: t("common.cancel", "Hủy"), style: "cancel" },
        { text: t("plan.apply.confirmCancel", "Xác nhận hủy"), style: "destructive", onPress: () => cancelApply.mutate(apply.id) },
      ],
    );
  };

  const handleStatusChange = () => {
    let newStatus: PlanStatus;
    if (apply.status === "PENDING") newStatus = "APPLYING";
    else if (apply.status === "APPLYING" || apply.status === "ACTIVE") newStatus = "COMPLETED";
    else return;
    Alert.alert("Cập nhật trạng thái", `Chuyển sang trạng thái ${t(`plan.status.${newStatus}`, newStatus)}?`, [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: () => updateApplyStatus.mutate({ applyId: apply.id, status: newStatus, planId: apply.planId }) },
    ]);
  };

  // Filter events for selected date
  const filteredEventsForSelectedDate = selectedMonthDate
    ? events.filter((e) => {
        const start = e.calculatedStartDate;
        const end = e.calculatedEndDate ?? start;
        return start && start <= selectedMonthDate && (end ?? start) >= selectedMonthDate;
      })
    : events;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Section */}
        <View className="px-5 pt-2 pb-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push("/(main)/plans")} className="mr-3 p-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <ChevronLeft size={24} color="#64748b" />
            </TouchableOpacity>
            <View className={`rounded-full border px-3 py-1 ${sStyle.split(" text-")[0]}`}>
              <Text className={`text-[10px] font-black uppercase tracking-widest ${sStyle.split(" text-")[1]}`}>{statusLabel}</Text>
            </View>
          </View>

          <Text className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {apply.targetName || apply.planName || "Bản áp dụng"}
          </Text>
          <Text className="text-sm font-semibold text-slate-500">Kế hoạch: {apply.planName}</Text>

          <View className="mt-4 flex-row items-center gap-1.5">
            <CalendarDays size={14} color="#94a3b8" />
            <Text className="text-xs font-semibold text-slate-400">Bắt đầu: {formatDate(apply.startDate?.toString())}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="px-5 py-4 flex-row gap-3">
          {(apply.status === "PENDING" || apply.status === "APPLYING" || apply.status === "ACTIVE") && (
            <TouchableOpacity onPress={handleStatusChange} className={`flex-1 flex-row justify-center items-center rounded-2xl px-4 py-3.5 shadow-sm ${apply.status === "PENDING" ? "bg-purple-600" : "bg-emerald-600"}`}>
              {apply.status === "PENDING" ? <Play size={18} color="#ffffff" className="mr-2" /> : <CheckCircle2 size={18} color="#ffffff" className="mr-2" />}
              <Text className="text-sm font-black text-white">{apply.status === "PENDING" ? "Bắt đầu áp dụng" : "Đánh dấu hoàn thành"}</Text>
            </TouchableOpacity>
          )}
          {(apply.status === "PENDING" || apply.status === "APPLYING" || apply.status === "ACTIVE") && apply.canCancel !== false && (
            <TouchableOpacity onPress={handleCancel} className="flex-row justify-center items-center rounded-2xl border border-red-100 bg-white px-4 py-3.5 shadow-sm dark:bg-slate-800 dark:border-red-900/50" disabled={cancelApply.isPending}>
              {cancelApply.isPending ? <ActivityIndicator size="small" color="#dc2626" className="mr-2" /> : <XCircle size={18} color="#dc2626" className="mr-2" />}
              <Text className="text-sm font-black text-red-600">{cancelApply.isPending ? "Đang hủy..." : "Hủy"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Scope Info */}
        <View className="px-5 mb-5">
          <View className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <View className="flex-row items-center gap-2 mb-4">
              <Target size={18} color="#64748b" />
              <Text className="text-base font-black text-slate-900 dark:text-white">Phạm vi áp dụng</Text>
            </View>
            <View className="gap-3">
              <View className="flex-row items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                <Sprout size={16} color="#059669" strokeWidth={2.5} />
                <View className="flex-1">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cây trồng</Text>
                  <Text className="text-sm font-bold text-slate-800 dark:text-slate-200" numberOfLines={1}>{plantQuery.data?.nickName || plantQuery.data?.plantNumber || apply.plantId || "Chưa gắn"}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                <MapPin size={16} color="#059669" strokeWidth={2.5} />
                <View className="flex-1">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vườn</Text>
                  <Text className="text-sm font-bold text-slate-800 dark:text-slate-200" numberOfLines={1}>{plotQuery.data?.name || apply.farmPlotId || "Chưa gắn"}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Calendar Section ── */}
        <View className="px-5 mb-5">
          <View className="rounded-3xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <View className="px-5 pt-5 pb-4">
              <View className="flex-row items-center gap-2 mb-4">
                <CalendarDays size={18} color="#64748b" />
                <Text className="text-base font-black text-slate-900 dark:text-white">Lịch sự kiện</Text>
              </View>

              <CalendarMonthView
                events={events}
                currentMonth={currentMonth}
                selectedDate={selectedMonthDate}
                onMonthChange={setCurrentMonth}
                onDateSelect={setSelectedMonthDate}
                dateFnsLocale={dateFnsLocale}
                scheme={scheme}
                primaryColor={palette.primary}
                textColor={palette.text}
                textGrayColor={palette.textGray}
                placeholderColor={palette.textInputPlaceholder}
              />
            </View>

            {/* Events for selected date */}
            <View className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
                  {selectedMonthDate
                    ? format(new Date(selectedMonthDate + "T00:00:00"), "EEEE, MMM d, yyyy", { locale: dateFnsLocale })
                    : `Tất cả sự kiện (${events.length})`
                  }
                </Text>
                {selectedMonthDate && (
                  <TouchableOpacity
                    onPress={() => setSelectedMonthDate(null)}
                    className="flex-row items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800"
                  >
                    <Text className="text-xs font-semibold text-slate-500">Xem tất cả</Text>
                  </TouchableOpacity>
                )}
              </View>
              <EventGroupedList
                events={filteredEventsForSelectedDate}
                onPressEvent={(id) => router.push(`/(main)/plant-events/${id}` as never)}
                onToggleComplete={(e) => updateEvent.mutate({ eventId: e.id, body: { completed: !e.completed } })}
                onToggleTask={(e, idx) => toggleTask.mutate({ eventId: e.id, taskIndex: idx })}
                isLoading={eventsQuery.isLoading}
                isError={eventsQuery.isError}
                emptyMessage={selectedMonthDate ? "Không có sự kiện nào trong ngày này" : "Không có sự kiện nào"}
              />
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
