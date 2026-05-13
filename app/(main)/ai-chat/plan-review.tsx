import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  FlaskConical,
  ShieldAlert,
} from "lucide-react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { useTranslation } from "react-i18next";
import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  isValid,
  parseISO,
  startOfDay,
  subMonths,
} from "date-fns";

import {
  resolveScheduleDateRange,
  dateInRange,
} from "@/src/features/rag-chat/utils/planReviewUtils";
import { SummaryRow } from "@/src/features/rag-chat/components/plan-review/SummaryRow";
import { ScheduleEventEditor } from "@/src/features/rag-chat/components/plan-review/ScheduleEventEditor";

import { EventTypePickerModal } from "@/src/features/plant-event/components/EventTypePickerModal";
import { TargetPickerDropdown } from "@/src/features/plant-event/components/TargetPickerDropdown";
import {
  getEventCategory,
  getEventTypeIcon,
} from "@/src/features/plant-event/components/plant-event.types";
import {
  CATEGORY_DOT_COLORS,
  initCalendarLocale,
} from "@/src/features/plant-event/components/calendarConstants";

import { formatConfidence } from "@/src/features/rag-chat/utils/planNormalizer";
import { usePlanReviewerScreen } from "@/src/features/rag-chat/hooks/usePlanReviewerScreen";



import { SafeAreaView } from "react-native-safe-area-context";

export default function SafePlanReviewerScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PlanReviewerScreen />
    </SafeAreaView>
  );
}

function PlanReviewerScreen() {
  const { i18n } = useTranslation();
  const {
    draft,
    plan,
    schedule,
    targetType,
    setTargetType,
    selectedId,
    selectedName,
    selectedPlotIdForZones,
    setSelectedPlotIdForZones,
    farmPlots,
    plants,
    farmZones,
    farmZonesLoading,
    updateScheduleEvent,
    handleSelectTarget,
    submit,
    formError,
    eventErrors,
    isSubmitting,
    activeEventTypePickerIndex,
    setActiveEventTypePickerIndex,
    clearDraft,
    router,
    t,
  } = usePlanReviewerScreen();

  const confidenceLabel = useMemo(
    () => formatConfidence(plan?.confidenceScore),
    [plan?.confidenceScore],
  );

  const activeEvent =
    activeEventTypePickerIndex === null
      ? null
      : (schedule[activeEventTypePickerIndex] ?? null);

  const dateFnsLocale = useMemo(
    () => initCalendarLocale(i18n.language),
    [i18n.language],
  );

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );

  const scheduleWithCalendarRange = useMemo(() => {
    const baseDate = startOfDay(new Date());
    return schedule.map((event, index) => {
      const { startDate, endDate } = resolveScheduleDateRange(event, baseDate);
      const color = event.eventType
        ? CATEGORY_DOT_COLORS[getEventCategory(event.eventType)]
        : "#22c55e";

      return {
        index,
        startDate,
        endDate,
        color,
      };
    });
  }, [schedule]);

  const calendarMarkedDates = useMemo(() => {
    const marks: Record<
      string,
      {
        dots?: Array<{ key: string; color: string }>;
        selected?: boolean;
        selectedColor?: string;
      }
    > = {};

    for (const item of scheduleWithCalendarRange) {
      if (!item.startDate || !item.endDate) {
        continue;
      }

      const start = parseISO(item.startDate);
      const end = parseISO(item.endDate);
      for (let day = new Date(start); day <= end; day = addDays(day, 1)) {
        const key = format(day, "yyyy-MM-dd");
        if (!marks[key]) {
          marks[key] = { dots: [] };
        }

        const hasDot = marks[key].dots?.some((dot) => dot.color === item.color);
        if (!hasDot) {
          marks[key].dots = [
            ...(marks[key].dots ?? []),
            { key: `${key}-${item.color}`, color: item.color },
          ];
        }
      }
    }

    if (!marks[selectedCalendarDate]) {
      marks[selectedCalendarDate] = {};
    }
    marks[selectedCalendarDate].selected = true;
    marks[selectedCalendarDate].selectedColor = SELECTED_DAY_COLOR;

    return marks;
  }, [scheduleWithCalendarRange, selectedCalendarDate]);

  const selectedDateEventIndexes = useMemo(
    () =>
      scheduleWithCalendarRange
        .filter(
          (item) =>
            item.startDate &&
            item.endDate &&
            dateInRange(selectedCalendarDate, item.startDate, item.endDate),
        )
        .map((item) => item.index),
    [scheduleWithCalendarRange, selectedCalendarDate],
  );

  const undatedEventIndexes = useMemo(
    () =>
      scheduleWithCalendarRange
        .filter((item) => !item.startDate)
        .map((item) => item.index),
    [scheduleWithCalendarRange],
  );

  const isCurrentCalendarMonth = useMemo(
    () => isSameMonth(calendarMonth, new Date()),
    [calendarMonth],
  );

  const selectedDateLabel = useMemo(() => {
    const parsed = parseISO(selectedCalendarDate);
    if (!isValid(parsed)) {
      return selectedCalendarDate;
    }

    return format(parsed, "EEEE, MMM d, yyyy", { locale: dateFnsLocale });
  }, [dateFnsLocale, selectedCalendarDate]);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: "transparent",
      calendarBackground: "transparent",
      textSectionTitleColor: "#64748b",
      selectedDayBackgroundColor: SELECTED_DAY_COLOR,
      selectedDayTextColor: "#FFFFFF",
      todayTextColor: "#2F7F34",
      dayTextColor: "#1e293b",
      textDisabledColor: "#cbd5e1",
      dotColor: "#2F7F34",
      arrowColor: "#2F7F34",
      monthTextColor: "#1e293b",
      textDayFontWeight: "500" as const,
      textMonthFontWeight: "700" as const,
      textDayHeaderFontWeight: "600" as const,
      textDayFontSize: 14,
      textMonthFontSize: 16,
      textDayHeaderFontSize: 12,
    }),
    [],
  );

  const renderScheduleEventEditor = (index: number) => {
    const event = schedule[index];
    if (!event) {
      return null;
    }

    return (
      <ScheduleEventEditor
        key={`schedule-event-${index}`}
        event={event}
        index={index}
        eventErrors={eventErrors[index]}
        updateScheduleEvent={updateScheduleEvent}
        setActiveEventTypePickerIndex={setActiveEventTypePickerIndex}
      />
    );
  };

  if (!draft || !plan) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <View className="items-center rounded-2xl border border-slate-200 bg-white p-5">
          <AlertTriangle size={28} color="#f97316" />
          <Text className="mt-3 text-base font-bold text-slate-800">
            {t(
              "ragChat.reviewer.missingDraftTitle",
              "No treatment plan to review",
            )}
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            {t(
              "ragChat.reviewer.missingDraftDescription",
              "Please generate a treatment plan from AI chat first.",
            )}
          </Text>
          <TouchableOpacity
            className="mt-4 rounded-xl bg-emerald-700 px-4 py-2"
            onPress={() => router.replace("/(main)/ai-chat")}
          >
            <Text className="text-sm font-semibold text-white">
              {t("ragChat.reviewer.backToChat", "Back to AI chat")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <Text className="text-base font-bold text-emerald-900">
            {t("ragChat.reviewer.title", "Treatment Plan Reviewer")}
          </Text>
          <Text className="mt-1 text-xs text-emerald-700">
            {t(
              "ragChat.reviewer.subtitle",
              "Review, edit, and submit this plan to create plant events.",
            )}
          </Text>
          <View className="mt-3 flex-row flex-wrap">
            <SummaryRow
              label={t("ragChat.reviewer.summary.disease", "Disease")}
              value={plan.diseaseName}
            />
            <SummaryRow
              label={t("ragChat.reviewer.summary.severity", "Severity")}
              value={plan.severityLevel}
            />
            <SummaryRow
              label={t("ragChat.reviewer.summary.urgency", "Urgency")}
              value={plan.urgency}
            />
            <SummaryRow
              label={t("ragChat.reviewer.summary.confidence", "Confidence")}
              value={confidenceLabel}
            />
            <SummaryRow
              label={t("ragChat.reviewer.summary.cost", "Estimated cost")}
              value={plan.estimatedCost}
            />
            <SummaryRow
              label={t("ragChat.reviewer.summary.planId", "RAG Plan ID")}
              value={draft.savedPlanId}
            />
          </View>
        </View>

        {plan.safetyWarnings.length > 0 && (
          <View className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <View className="mb-2 flex-row items-center gap-2">
              <ShieldAlert size={16} color="#b45309" />
              <Text className="text-sm font-bold text-amber-900">
                {t("ragChat.reviewer.safetyTitle", "Safety warnings")}
              </Text>
            </View>
            {plan.safetyWarnings.map((warning, index) => (
              <View
                key={`${warning}-${index}`}
                className="mb-1 flex-row items-start gap-2"
              >
                <CircleDot size={12} color="#b45309" style={{ marginTop: 2 }} />
                <Text className="flex-1 text-xs leading-5 text-amber-800">
                  {warning}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
          <Text className="mb-2 text-sm font-bold text-slate-800">
            {t("ragChat.reviewer.targetTitle", "Event target")}
          </Text>
          <TargetPickerDropdown
            targetType={targetType}
            setTargetType={setTargetType}
            selectedId={selectedId}
            farmPlots={farmPlots}
            plants={plants}
            farmZonesData={farmZones}
            farmZonesLoading={farmZonesLoading}
            selectedPlotIdForZones={selectedPlotIdForZones}
            setSelectedPlotIdForZones={setSelectedPlotIdForZones}
            onSelectTarget={handleSelectTarget}
            primaryColor="#2F7F34"
          />
          {!!selectedName && (
            <Text className="mt-2 text-xs text-slate-500">
              {t("ragChat.reviewer.selectedTarget", "Selected")}: {selectedName}
            </Text>
          )}
        </View>

        <View className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-slate-800">
              {t("ragChat.reviewer.scheduleTitle", "Planned events")}
            </Text>
            <Text className="text-xs font-medium text-slate-500">
              {schedule.length} {t("calendar.events", "events")}
            </Text>
          </View>

          <View className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <View className="flex-row items-center justify-between px-3 pt-3 pb-1">
              <TouchableOpacity
                className="rounded-lg bg-slate-100 p-2"
                onPress={() => setCalendarMonth((prev) => subMonths(prev, 1))}
              >
                <ChevronLeft size={16} color="#64748b" />
              </TouchableOpacity>

              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-bold text-slate-800 capitalize">
                  {format(calendarMonth, "MMMM yyyy", {
                    locale: dateFnsLocale,
                  })}
                </Text>
                {!isCurrentCalendarMonth && (
                  <TouchableOpacity
                    className="rounded-full bg-emerald-100 px-2.5 py-1"
                    onPress={() => {
                      const now = new Date();
                      setCalendarMonth(now);
                      setSelectedCalendarDate(format(now, "yyyy-MM-dd"));
                    }}
                  >
                    <Text className="text-[10px] font-bold text-emerald-700">
                      {t("calendar.today", "Today")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                className="rounded-lg bg-slate-100 p-2"
                onPress={() => setCalendarMonth((prev) => addMonths(prev, 1))}
              >
                <ChevronRight size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Calendar
              current={format(calendarMonth, "yyyy-MM-dd")}
              markedDates={calendarMarkedDates}
              markingType="multi-dot"
              hideArrows
              hideExtraDays
              renderHeader={() => null}
              onMonthChange={(month) => {
                const parsedMonth = parseISO(month.dateString);
                if (isValid(parsedMonth)) {
                  setCalendarMonth(parsedMonth);
                }
              }}
              onDayPress={(day: DateData) =>
                setSelectedCalendarDate(day.dateString)
              }
              theme={calendarTheme}
              style={{ paddingHorizontal: 4, paddingBottom: 8 }}
            />
          </View>

          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-slate-700 capitalize">
              {selectedDateLabel}
            </Text>
            <Text className="text-xs font-medium text-slate-500">
              {selectedDateEventIndexes.length} {t("calendar.events", "events")}
            </Text>
          </View>

          {selectedDateEventIndexes.length === 0 ? (
            <View className="mb-3 items-center rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <CalendarDays size={28} color="#94a3b8" />
              <Text className="mt-2 text-center text-sm text-slate-500">
                {t(
                  "ragChat.reviewer.noEventsOnSelectedDate",
                  "No events on this day. Select another date to review events.",
                )}
              </Text>
            </View>
          ) : (
            selectedDateEventIndexes.map((index) =>
              renderScheduleEventEditor(index),
            )
          )}

          {undatedEventIndexes.length > 0 && (
            <View className="mt-1">
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {t("ragChat.reviewer.undatedEvents", "Events without date")}
              </Text>
              {undatedEventIndexes.map((index) =>
                renderScheduleEventEditor(index),
              )}
            </View>
          )}
        </View>

        {plan.requiredInputs.length > 0 && (
          <View className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
            <Text className="mb-2 text-sm font-bold text-slate-800">
              {t("ragChat.reviewer.requiredInputsTitle", "Required inputs")}
            </Text>
            {plan.requiredInputs.map((item, index) => (
              <Text
                key={`${item}-${index}`}
                className="mb-1 text-xs text-slate-700"
              >
                - {item}
              </Text>
            ))}
          </View>
        )}

        {!!formError && (
          <View className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">{formError}</Text>
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex-row gap-2 border-t border-slate-200 bg-white px-4 py-3">
        <TouchableOpacity
          className="flex-1 items-center rounded-xl border border-slate-300 py-3"
          onPress={() => {
            clearDraft();
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace("/(main)/ai-chat");
          }}
          disabled={isSubmitting}
        >
          <Text className="text-sm font-semibold text-slate-700">
            {t("ragChat.reviewer.cancel", "Cancel")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 items-center rounded-xl bg-emerald-700 py-3"
          onPress={submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-sm font-semibold text-white">
              {t("ragChat.reviewer.submit", "Submit plan")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <EventTypePickerModal
        visible={activeEventTypePickerIndex !== null}
        selectedEventType={activeEvent?.eventType}
        onClose={() => setActiveEventTypePickerIndex(null)}
        onSelect={(eventType) => {
          if (activeEventTypePickerIndex === null) return;
          updateScheduleEvent(activeEventTypePickerIndex, { eventType });
          setActiveEventTypePickerIndex(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

