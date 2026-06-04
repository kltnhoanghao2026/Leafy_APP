import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Layers,
  MapPin,
  Plus,
  Sprout,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  isToday as isDateToday,
  isSameDay,
} from "date-fns";

import type {
  CalendarParams,
  EventCategory,
  EventTargetType,
  PlantEventResponse,
} from "./plant-event.types";
import { EVENT_CATEGORY_MAP, getEventCategory } from "./plant-event.types";
import {
  usePlantEventsCalendar,
  useUpdatePlantEventMutation,
  useToggleTaskMutation,
} from "../queries";
import { usePlants } from "../../plant/queries";
import { useFarmPlotsByOwner, useFarmZonesByPlot } from "../../farm/queries";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import Colors from "@/src/constants/Colors";

import { CATEGORY_DOT_COLORS, initCalendarLocale } from "./calendarConstants";
import { PlantEventHubCategorySection } from "./PlantEventHubCategorySection";
import { EventGroupedList } from "@/src/features/shared/components/EventGroupedList";
import { PlantEventHubFilterBar, type FilterState } from "./PlantEventHubFilterBar";
import { SuccessPromptModal } from "./SuccessPromptModal";
import { useMyApplies } from "../../plan/queries/plan.queries";

const SELECTED_DAY_COLOR = "#2F7F34";

type ViewType = "month" | "week" | "timeline";

export type PlantEventHubScreenProps = {
  defaultView?: ViewType;
  hideFilter?: boolean;
  detailReturnTo?: "/(main)/plant-events" | "/(main)/calendar";
};

export function PlantEventHubScreen({
  defaultView = "month",
  hideFilter = false,
  detailReturnTo = "/(main)/plant-events",
}: PlantEventHubScreenProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    targetType?: string;
    selectedId?: string;
    selectedName?: string;
  }>();
  const { profileId } = useAuthContext();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const dateFnsLocale = initCalendarLocale(i18n.language);

  // ── View tab ──────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ViewType>(defaultView);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  // ── Filter state ──────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<FilterState>({
    farmPlotId: "",
    farmZoneId: "",
    plantId: "",
    targetType: "",
    eventType: "",
    selectedApplyId: "",
  });

  const activeFilterCount = [
    activeFilter.farmPlotId,
    activeFilter.farmZoneId,
    activeFilter.plantId,
    activeFilter.targetType,
    activeFilter.eventType,
    activeFilter.selectedApplyId,
  ].filter(Boolean).length;

  const isFiltered = activeFilterCount > 0;

  // ── ApplyPlan success flow ───────────────────────────────────────────
  const [pendingCompleteApply, setPendingCompleteApply] = useState<{
    applyId: string;
    eventId: string;
    planName?: string;
  } | null>(null);

  // ── Shared target state ───────────────────────────────────────────────
  const [targetType, setTargetType] = useState<EventTargetType>(
    (params.targetType as EventTargetType) || "FARM_PLOT",
  );
  const [selectedId, setSelectedId] = useState(params.selectedId ?? "");
  const [selectedName, setSelectedName] = useState(params.selectedName ?? "");
  const [selectedPlotIdForZones] = useState("");
  const [selectedApplyId] = useState("");

  // ── Month view state ──────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState<string | null>(
    format(new Date(), "yyyy-MM-dd"),
  );

  // ── Week view state ───────────────────────────────────────────────────
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedWeekDate, setSelectedWeekDate] = useState<string | null>(
    format(new Date(), "yyyy-MM-dd"),
  );

  // ── Timeline view state ───────────────────────────────────────────────
  const [timelineMonth, setTimelineMonth] = useState(new Date());

  // ── Data hooks ────────────────────────────────────────────────────────
  const farmPlotsQuery = useFarmPlotsByOwner(profileId ?? "");
  const plantsQuery = usePlants({ page: 0, size: 100 });
  const farmZonesQuery = useFarmZonesByPlot(selectedPlotIdForZones);
  const appliesQuery = useMyApplies({ size: 100 });
  const farmPlots = farmPlotsQuery.data ?? [];
  const plants = plantsQuery.data?.content ?? [];
  const applies = appliesQuery.data?.content ?? [];

  // ── Date ranges ───────────────────────────────────────────────────────
  const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStartStr],
  );

  const tlMonthStart = format(startOfMonth(timelineMonth), "yyyy-MM-dd");
  const tlMonthEnd = format(endOfMonth(timelineMonth), "yyyy-MM-dd");

  // ── Single data fetch, range adapts to active view ────────────────────
  const calendarParams: CalendarParams = useMemo(
    () => ({
      // If no farmPlotId is selected, we default to “all farms” (no farmPlotId filter)
      ...(activeFilter.farmPlotId ? { farmPlotId: activeFilter.farmPlotId } : {}),
      ...(activeFilter.farmZoneId ? { farmZoneId: activeFilter.farmZoneId } : {}),
      ...(activeFilter.plantId ? { plantId: activeFilter.plantId } : {}),
      ...(selectedApplyId || activeFilter.selectedApplyId
        ? { planApplyId: activeFilter.selectedApplyId || selectedApplyId }
        : {}),
      ...(activeFilter.eventType ? { eventType: activeFilter.eventType } : {}),
      ...(activeView === "week"
        ? { startDate: weekStartStr, endDate: weekEndStr }
        : activeView === "timeline"
          ? { startDate: tlMonthStart, endDate: tlMonthEnd }
          : { startDate: monthStart, endDate: monthEnd }),
    }),
    [
      activeFilter,
      activeView,
      weekStartStr,
      weekEndStr,
      tlMonthStart,
      tlMonthEnd,
      monthStart,
      monthEnd,
      selectedApplyId,
    ],
  );

  const eventsQuery = usePlantEventsCalendar(calendarParams);
  const updateEventMutation = useUpdatePlantEventMutation();
  const toggleTaskMutation = useToggleTaskMutation();

  // Optimistic: keep last known events so UI never blanks out on refetch
  const stableEventsRef = useRef<PlantEventResponse[]>([]);
  if (eventsQuery.data && eventsQuery.data.length > 0) {
    stableEventsRef.current = eventsQuery.data;
  }
  // Map of eventId → optimistic completed override
  const [optimisticOverrides, setOptimisticOverrides] = useState<Record<string, boolean>>({});

  const rawEvents = eventsQuery.data ?? stableEventsRef.current;
  const events = rawEvents.map((e) =>
    e.id in optimisticOverrides ? { ...e, completed: optimisticOverrides[e.id] } : e,
  );

  // ── Toggle handlers ───────────────────────────────────────────────────
  const handleToggleComplete = async (event: PlantEventResponse) => {
    const next = !event.completed;
    // Apply optimistic override immediately
    setOptimisticOverrides((prev) => ({ ...prev, [event.id]: next }));
    try {
      const response = await updateEventMutation.mutateAsync({
        eventId: event.id,
        body: { completed: next },
      });
      // plantEventApi.updateEvent returns Axios response; extract the actual event
      const updated: PlantEventResponse | undefined =
        response?.data?.data ?? response;

      // ApplyPlan success logic: if this was the last incomplete event,
      // prompt the user to confirm plan success or failure
      if (
        updated?.isLastIncompleteEventForApply &&
        updated.planApplyId
      ) {
        setPendingCompleteApply({
          applyId: updated.planApplyId,
          eventId: updated.id,
          planName: updated.planApply?.planName ?? undefined,
        });
      }
    } catch {
      // Rollback the optimistic override on error
      setOptimisticOverrides((prev) => {
        const next2 = { ...prev };
        delete next2[event.id];
        return next2;
      });
    } finally {
      // Clear override once server state has been re-fetched
      setOptimisticOverrides((prev) => {
        const next2 = { ...prev };
        delete next2[event.id];
        return next2;
      });
    }
  };

  const handleToggleTask = (event: PlantEventResponse, taskIndex: number) => {
    toggleTaskMutation.mutate({ eventId: event.id, taskIndex });
  };

  // Apply active filter (client-side fallback for any remaining filtering)
  // Note: Main filtering is done server-side via calendarParams
  const filteredEvents: PlantEventResponse[] = useMemo(() => {
    if (!isFiltered) return Array.isArray(events) ? events : [];
    return (Array.isArray(events) ? events : []).filter((e) => {
      // Additional client-side filters if needed
      if (activeFilter.eventType && e.eventType !== activeFilter.eventType) {
        return false;
      }
      return true;
    });
  }, [events, activeFilter, isFiltered]);

  // ── Default to “All farms” ────────────────────────────────────────────
  // By default we show events across all farm plots (no farmPlotId filter)
  // and keep the target label as “All farms”. Users can still filter via the filter bar.
  useEffect(() => {
    if (selectedId) return;
    setTargetType("FARM_PLOT");
    setSelectedId("ALL");
    setSelectedName(t("calendar.allFarms", { defaultValue: "Tất cả nông trại" }));
  }, [selectedId, t]);

  // ── Shared handlers ───────────────────────────────────────────────────
  const handleNavigateToEvent = (eventId: string) => {
    router.push({
      pathname: "/(main)/plant-events/[id]",
      params: {
        id: eventId,
        returnTo: detailReturnTo,
      },
    });
  };

  const handleAddEvent = () => {
    const dateParam =
      activeView === "week" ? selectedWeekDate : selectedMonthDate;
    const baseParams = dateParam ? { calculatedStartDate: dateParam } : {};
    if (targetType === "FARM_PLOT" && selectedId) {
      router.push({
        pathname: "/(main)/plant-events/add",
        params: {
          farmPlotId: selectedId,
          farmPlotName: selectedName,
          targetType: "FARM_PLOT",
          ...baseParams,
        },
      });
    } else if (targetType === "FARM_ZONE" && selectedId) {
      router.push({
        pathname: "/(main)/plant-events/add",
        params: {
          farmZoneId: selectedId,
          farmZoneName: selectedName,
          targetType: "FARM_ZONE",
          ...baseParams,
        },
      });
    } else if (targetType === "PLANT" && selectedId) {
      router.push({
        pathname: "/(main)/plant-events/add",
        params: {
          plantId: selectedId,
          plantName: selectedName,
          targetType: "PLANT",
          ...baseParams,
        },
      });
    }
  };

  // ── Month: markedDates ────────────────────────────────────────────────
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const today = format(new Date(), "yyyy-MM-dd");

    for (const event of filteredEvents) {
      const start = event.calculatedStartDate;
      const end = event.calculatedEndDate ?? start;
      if (!start) continue;
      const category = getEventCategory(event.eventType);
      const dotColor = CATEGORY_DOT_COLORS[category];
      const startD = new Date(start);
      const endD = new Date(end!);
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = format(d, "yyyy-MM-dd");
        if (!marks[key])
          marks[key] = { events: [], selected: false, isToday: key === today };
        if (!marks[key].events.some((e: any) => e.id === event.id)) {
          marks[key].events.push({
            id: event.id,
            type: event.eventType,
            category,
            color: dotColor,
          });
        }
      }
    }
    if (selectedMonthDate) {
      if (!marks[selectedMonthDate])
        marks[selectedMonthDate] = {
          events: [],
          selected: true,
          isToday: selectedMonthDate === today,
        };
      else marks[selectedMonthDate].selected = true;
    }
    if (!marks[today])
      marks[today] = { events: [], selected: false, isToday: true };
    return marks;
  }, [filteredEvents, selectedMonthDate]);

  // ── Week: dayEventMap ─────────────────────────────────────────────────
  const dayEventMap = useMemo(() => {
    const map: Record<string, PlantEventResponse[]> = {};
    const evts: PlantEventResponse[] = Array.isArray(filteredEvents) ? filteredEvents : [];
    for (const event of evts) {
      const start = event.calculatedStartDate;
      const end = event.calculatedEndDate ?? start;
      if (!start) continue;
      const startD = new Date(start);
      const endD = new Date(end!);
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = format(d, "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        if (!map[key].some((e) => e.id === event.id)) map[key].push(event);
      }
    }
    return map;
  }, [filteredEvents]);

  // ── Timeline: grouped events ──────────────────────────────────────────
  const groupedEvents = useMemo(() => {
    const map: Record<string, PlantEventResponse[]> = {};
    const sorted = [...filteredEvents].sort((a, b) =>
      (a.calculatedStartDate ?? "").localeCompare(b.calculatedStartDate ?? ""),
    );
    for (const event of sorted) {
      if (!event.calculatedStartDate) continue;
      const key = event.calculatedStartDate;
      if (!map[key]) map[key] = [];
      if (!map[key].some((e) => e.id === event.id)) map[key].push(event);
    }
    return map;
  }, [filteredEvents]);
  const groupedDates = Object.keys(groupedEvents).sort();

  // ── Derived events ────────────────────────────────────────────────────
  const selectedMonthDateEvents: PlantEventResponse[] = useMemo(() => {
    if (!selectedMonthDate) return [];
    return filteredEvents.filter((e) => {
      const start = e.calculatedStartDate;
      const end = e.calculatedEndDate ?? start;
      return (
        start &&
        start <= selectedMonthDate &&
        (end ?? start) >= selectedMonthDate
      );
    });
  }, [filteredEvents, selectedMonthDate]);

  const selectedWeekDateEvents: PlantEventResponse[] = useMemo(
    () => (selectedWeekDate ? (dayEventMap[selectedWeekDate] ?? []) : []),
    [dayEventMap, selectedWeekDate],
  );

  const isCurrentWeekNow = useMemo(() => {
    const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return isSameDay(weekStart, todayWeekStart);
  }, [weekStart]);

  const isCurrentMonthNow = useMemo(() => {
    const now = new Date();
    return (
      now.getFullYear() === currentMonth.getFullYear() &&
      now.getMonth() === currentMonth.getMonth()
    );
  }, [currentMonth]);

  // ── Calendar theme ────────────────────────────────────────────────────
  const calendarTheme = useMemo(
    () => ({
      backgroundColor: "transparent",
      calendarBackground: "transparent",
      textSectionTitleColor: palette.textGray,
      selectedDayBackgroundColor: SELECTED_DAY_COLOR,
      selectedDayTextColor: "#FFFFFF",
      todayTextColor: palette.primary,
      dayTextColor: palette.text,
      textDisabledColor: palette.textInputPlaceholder,
      dotColor: palette.primary,
      arrowColor: palette.primary,
      monthTextColor: palette.text,
      textDayFontWeight: "500" as const,
      textMonthFontWeight: "700" as const,
      textDayHeaderFontWeight: "600" as const,
      textDayFontSize: 14,
      textMonthFontSize: 16,
      textDayHeaderFontSize: 12,
    }),
    [palette],
  );

  // ── Shared: empty state ───────────────────────────────────────────────
  const renderNoTarget = () => (
    <View className="mx-4 mt-8 items-center rounded-3xl bg-white p-8 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      <View className="bg-slate-50 dark:bg-slate-800 rounded-full p-4 mb-4">
        <MapPin
          size={48}
          color={scheme === "dark" ? "#475569" : "#cbd5e1"}
          strokeWidth={1.5}
        />
      </View>
      <Text className="text-base font-bold text-slate-700 dark:text-slate-300">
        {t("calendar.selectTarget")}
      </Text>
      <Text className="mt-2 px-4 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("calendar.selectTargetHint")}
      </Text>
    </View>
  );

  // ── Grouped event list helper ─────────────────────────────────────────
  const CATEGORY_ORDER: EventCategory[] = [
    "ROUTINE_CARE",
    "HEALTH_MEDICAL",
    "GROWTH_LIFECYCLE",
    "ALERTS",
  ];

  const renderGroupedEvents = (evts: PlantEventResponse[]) => {
    const grouped: Record<EventCategory, PlantEventResponse[]> = {
      ROUTINE_CARE: [],
      HEALTH_MEDICAL: [],
      GROWTH_LIFECYCLE: [],
      ALERTS: [],
    };
    for (const evt of evts) {
      const cat = EVENT_CATEGORY_MAP[evt.eventType] ?? "ROUTINE_CARE";
      grouped[cat].push(evt);
    }
    return (
      <>
        {CATEGORY_ORDER.map((cat) => {
          const catEvents = grouped[cat];
          if (catEvents.length === 0) return null;
          return (
            <PlantEventHubCategorySection
              key={cat}
              category={cat}
              events={catEvents}
              onPressEvent={handleNavigateToEvent}
              onToggleComplete={handleToggleComplete}
              onToggleTask={handleToggleTask}
            />
          );
        })}
      </>
    );
  };

  // ── Month view content ────────────────────────────────────────────────
  const renderMonthContent = () => (
    <>
      <View className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
        {/* Month navigation */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
          <TouchableOpacity
            className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => {
              setCurrentMonth((p) => subMonths(p, 1));
              setSelectedMonthDate(null);
            }}
          >
            <ChevronLeft size={18} color={palette.textGray} />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: dateFnsLocale })}
            </Text>
            {!isCurrentMonthNow && (
              <TouchableOpacity
                className="rounded-full bg-emerald-100 px-2.5 py-1 dark:bg-emerald-900/30"
                onPress={() => {
                  setCurrentMonth(new Date());
                  setSelectedMonthDate(format(new Date(), "yyyy-MM-dd"));
                }}
                activeOpacity={0.7}
              >
                <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  {t("calendar.today")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => {
              setCurrentMonth((p) => addMonths(p, 1));
              setSelectedMonthDate(null);
            }}
          >
            <ChevronRight size={18} color={palette.textGray} />
          </TouchableOpacity>
        </View>

        <Calendar
          key={`${monthStart}-${scheme}`}
          current={monthStart}
          markedDates={markedDates}
          onDayPress={(day: DateData) => setSelectedMonthDate(day.dateString)}
          hideArrows
          hideExtraDays
          renderHeader={() => null}
          theme={calendarTheme}
          style={{ paddingHorizontal: 4, paddingBottom: 8 }}
          dayComponent={({ date, state, marking }: any) => {
            const isSelected = marking?.selected;
            const isToday = marking?.isToday || state === "today";
            const dayEvents = marking?.events ?? [];
            const isTrailing = state === "disabled";

            const uniqueColors: string[] = [];
            for (const evt of dayEvents) {
              if (!uniqueColors.includes(evt.color))
                uniqueColors.push(evt.color);
            }
            const dots = uniqueColors.slice(0, 3);
            const hasMore = uniqueColors.length > 3;

            return (
              <TouchableOpacity
                onPress={() =>
                  date?.dateString && setSelectedMonthDate(date.dateString)
                }
                activeOpacity={0.6}
                style={{
                  width: 44,
                  alignItems: "center",
                  paddingVertical: 4,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? scheme === "dark"
                      ? "#4ade80"
                      : "#86efac"
                    : "transparent",
                  backgroundColor: isSelected
                    ? scheme === "dark"
                      ? "rgba(16,185,129,0.12)"
                      : "#f0fdf4"
                    : "transparent",
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected
                      ? SELECTED_DAY_COLOR
                      : isToday
                        ? scheme === "dark"
                          ? "rgba(47,127,52,0.3)"
                          : "rgba(47,127,52,0.12)"
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected || isToday ? "700" : "500",
                      color: isSelected
                        ? "#ffffff"
                        : isTrailing
                          ? scheme === "dark"
                            ? "#475569"
                            : "#cbd5e1"
                          : isToday
                            ? palette.primary
                            : palette.text,
                    }}
                  >
                    {date?.day}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 4,
                    height: 6,
                    gap: 2,
                  }}
                >
                  {dots.map((color, i) => (
                    <View
                      key={i}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: color,
                      }}
                    />
                  ))}
                  {hasMore && (
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: "#94a3b8",
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
        {/* Dot legend */}
        <View className="flex-row items-center justify-center gap-5 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5">
          {(
            ["ROUTINE_CARE", "HEALTH_MEDICAL", "GROWTH_LIFECYCLE", "ALERTS"] as const
          ).map((cat) => (
            <View key={cat} className="flex-row items-center gap-1.5">
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: CATEGORY_DOT_COLORS[cat],
                }}
              />
              <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {t(`plantEvent.eventCategoryShort.${cat}`)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Selected date events */}
      {selectedMonthDate && (
        <View className="mx-4 mb-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
              {format(
                new Date(selectedMonthDate + "T00:00:00"),
                "EEEE, MMM d, yyyy",
                { locale: dateFnsLocale },
              )}
            </Text>
            <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {selectedMonthDateEvents.length}{" "}
              {selectedMonthDateEvents.length === 1
                ? t("calendar.event")
                : t("calendar.events")}
            </Text>
          </View>
          {selectedMonthDateEvents.length === 0 ? (
            <View className="items-center rounded-2xl bg-white p-8 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CalendarDays
                size={32}
                className="text-slate-200 dark:text-slate-700 mb-3"
              />
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("calendar.noEventsOnDay")}
              </Text>
            </View>
          ) : (
            <EventGroupedList
              events={selectedMonthDateEvents}
              onPressEvent={handleNavigateToEvent}
              onToggleComplete={handleToggleComplete}
              onToggleTask={handleToggleTask}
            />
          )}
        </View>
      )}

      {/* All month events summary */}
      {!selectedMonthDate && selectedId && (
        <View className="mx-4 mb-3">
          <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            {t("calendar.upcomingEvents")}
          </Text>
          {filteredEvents.length === 0 ? (
            <View className="items-center rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <CalendarDays
                size={32}
                className="text-slate-200 dark:text-slate-700 mb-3"
              />
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("calendar.noEventsThisMonth")}
              </Text>
            </View>
          ) : (
            <EventGroupedList
              events={[...filteredEvents].sort((a, b) =>
                (a.calculatedStartDate ?? "").localeCompare(b.calculatedStartDate ?? ""),
              )}
              onPressEvent={handleNavigateToEvent}
              onToggleComplete={handleToggleComplete}
              onToggleTask={handleToggleTask}
            />
          )}
        </View>
      )}
    </>
  );

  // ── Timeline view content ─────────────────────────────────────────────
  const renderTimelineContent = () => (
    <View className="mx-4 mt-2">
      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-4 rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
        <TouchableOpacity
          className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
          onPress={() => setTimelineMonth((p) => subMonths(p, 1))}
          activeOpacity={0.6}
        >
          <ChevronLeft size={18} color={palette.textGray} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-slate-800 dark:text-slate-100 capitalize">
          {format(timelineMonth, "MMMM yyyy", { locale: dateFnsLocale })}
        </Text>
        <TouchableOpacity
          className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
          onPress={() => setTimelineMonth((p) => addMonths(p, 1))}
          activeOpacity={0.6}
        >
          <ChevronRight size={18} color={palette.textGray} />
        </TouchableOpacity>
      </View>

      {/* Timeline list */}
      {groupedDates.length === 0 ? (
        <View className="items-center rounded-2xl bg-white mb-3 p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-900">
          <Clock
            size={32}
            className="text-slate-200 dark:text-slate-700 mb-3"
          />
          <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("calendar.noEventsThisMonth")}
          </Text>
        </View>
      ) : (
        <View className="relative mb-3">
          {/* Vertical line */}
          <View className="absolute left-3 top-2 bottom-6 w-[2px] bg-slate-200 dark:bg-slate-800" />
          {groupedDates.map((dateStr) => {
            const dayEvents = groupedEvents[dateStr];
            const dateObj = new Date(dateStr + "T00:00:00");
            return (
              <View key={dateStr} className="mb-6">
                <View className="mb-3 flex-row items-center">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <View className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </View>
                  <Text className="ml-3 text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
                    {format(dateObj, "EEEE, MMM d", { locale: dateFnsLocale })}
                  </Text>
                </View>
                <View className="pl-9">{renderGroupedEvents(dayEvents)}</View>
              </View>
            );
          })}
        </View>
      )}

      {/* Legend */}
      {selectedId && filteredEvents.length > 0 && (
        <View className="mb-3 flex-row items-center justify-center gap-5 rounded-2xl bg-white px-4 py-2.5 shadow-sm dark:bg-slate-900">
          {(
            ["ROUTINE_CARE", "HEALTH_MEDICAL", "GROWTH_LIFECYCLE", "ALERTS"] as const
          ).map((cat) => (
            <View key={cat} className="flex-row items-center gap-1.5">
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: CATEGORY_DOT_COLORS[cat],
                }}
              />
              <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {t(`plantEvent.eventCategoryShort.${cat}`)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // ── Week view: scrollable content (strip is sticky above) ─────────────
  const renderWeekContent = () => (
    <>
      {/* Selected date events */}
      {selectedWeekDate && selectedId && (
        <View className="mx-4 mt-3 mb-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
              {format(
                new Date(selectedWeekDate + "T00:00:00"),
                "EEEE, MMM d, yyyy",
                { locale: dateFnsLocale },
              )}
            </Text>
            <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {selectedWeekDateEvents.length}{" "}
              {selectedWeekDateEvents.length === 1
                ? t("calendar.event")
                : t("calendar.events")}
            </Text>
          </View>
          {selectedWeekDateEvents.length === 0 ? (
            <View className="items-center rounded-2xl bg-white p-8 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CalendarRange
                size={32}
                className="text-slate-200 dark:text-slate-700 mb-3"
              />
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("calendar.noEventsOnDay")}
              </Text>
            </View>
          ) : (
            <EventGroupedList
              events={selectedWeekDateEvents}
              onPressEvent={handleNavigateToEvent}
              onToggleComplete={handleToggleComplete}
              onToggleTask={handleToggleTask}
            />
          )}
        </View>
      )}

      {/* All week events */}
      {!selectedWeekDate && selectedId && (
        <View className="mx-4 mt-3 mb-3">
          <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            {t("calendar.eventsThisWeek")}
          </Text>
          {filteredEvents.length === 0 ? (
            <View className="items-center rounded-2xl bg-white p-8 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CalendarRange
                size={32}
                className="text-slate-200 dark:text-slate-700 mb-3"
              />
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("calendar.noEventsThisWeek")}
              </Text>
            </View>
          ) : (
            <EventGroupedList
              events={[...filteredEvents].sort((a, b) =>
                (a.calculatedStartDate ?? "").localeCompare(b.calculatedStartDate ?? ""),
              )}
              onPressEvent={handleNavigateToEvent}
              onToggleComplete={handleToggleComplete}
              onToggleTask={handleToggleTask}
            />
          )}
        </View>
      )}

      {/* Legend */}
      {selectedId && (
        <View className="mx-4 mb-3 flex-row items-center justify-center gap-5 rounded-2xl bg-white px-4 py-2.5 shadow-sm dark:bg-slate-900">
          {(
            ["ROUTINE_CARE", "HEALTH_MEDICAL", "GROWTH_LIFECYCLE", "ALERTS"] as const
          ).map((cat) => (
            <View key={cat} className="flex-row items-center gap-1.5">
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: CATEGORY_DOT_COLORS[cat],
                }}
              />
              <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {t(`plantEvent.eventCategoryShort.${cat}`)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* ── Sticky top bar ───────────────────────────────────────────── */}
      <View
        className="bg-white dark:bg-slate-900 z-10"
        style={{
          borderBottomWidth: 1,
          borderBottomColor:
            scheme === "dark" ? "rgba(47,127,52,0.2)" : "rgba(47,127,52,0.12)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="px-4 pt-1 pb-2">
          {/* Collapse toggle row */}
          <TouchableOpacity
            className="flex-row items-center justify-between"
            onPress={() => setHeaderCollapsed((v) => !v)}
            activeOpacity={0.7}
          >
            {/* Left: target icon + name */}
            <View className="flex-row items-center gap-2 flex-1 mr-3">
              <View
                style={{ backgroundColor: palette.primary + "1A" }}
                className="rounded-lg p-1"
              >
                {targetType === "FARM_PLOT" ? (
                  <MapPin size={14} color={palette.primary} />
                ) : targetType === "FARM_ZONE" ? (
                  <Layers size={14} color={palette.primary} />
                ) : (
                  <Sprout size={14} color={palette.primary} />
                )}
              </View>
              <Text
                className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1"
                numberOfLines={1}
              >
                {selectedName || t("calendar.selectTarget")}
              </Text>
            </View>

            {/* Right: active view pill + chevron */}
            <View className="flex-row items-center gap-2">
              <View
                style={{ backgroundColor: palette.primary + "1A" }}
                className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
              >
                {activeView === "month" ? (
                  <CalendarDays size={10} color={palette.primary} />
                ) : activeView === "week" ? (
                  <CalendarRange size={10} color={palette.primary} />
                ) : (
                  <Clock size={10} color={palette.primary} />
                )}
                <Text
                  style={{ color: palette.primary }}
                  className="text-[10px] font-bold"
                >
                  {activeView === "month"
                    ? t("calendar.monthView")
                    : activeView === "week"
                      ? t("calendar.weekView")
                      : t("calendar.timelineShort")}
                </Text>
              </View>
              <View className="rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {headerCollapsed ? (
                  <ChevronDown size={13} color={palette.textGray} />
                ) : (
                  <ChevronUp size={13} color={palette.textGray} />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {!headerCollapsed && (
            <>
              {/* View tab switcher */}
              <View className="flex-row mt-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {(["month", "week", "timeline"] as ViewType[]).map((view) => {
                  const isActive = activeView === view;
                  const Icon =
                    view === "month"
                      ? CalendarDays
                      : view === "week"
                        ? CalendarRange
                        : Clock;
                  const label =
                    view === "month"
                      ? t("calendar.monthView")
                      : view === "week"
                        ? t("calendar.weekView")
                        : t("calendar.timelineShort");
                  return (
                    <TouchableOpacity
                      key={view}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        paddingVertical: 6,
                        gap: 2,
                        borderRadius: 10,
                        backgroundColor: isActive
                          ? scheme === "dark"
                            ? "#334155"
                            : "#ffffff"
                          : "transparent",
                        shadowOpacity: isActive ? 0.06 : 0,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 1 },
                        elevation: isActive ? 2 : 0,
                      }}
                      onPress={() => setActiveView(view)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        size={16}
                        color={isActive ? palette.primary : palette.textGray}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: isActive ? "700" : "500",
                          color: isActive ? palette.primary : palette.textGray,
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Week view: sticky week nav + day strip */}
              {activeView === "week" && (
                <>
                  {/* Week nav */}
                  <View className="flex-row items-center justify-between mt-2">
                    <TouchableOpacity
                      className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800"
                      onPress={() => {
                        setCurrentWeek((p) => subWeeks(p, 1));
                        setSelectedWeekDate(null);
                      }}
                      activeOpacity={0.6}
                    >
                      <ChevronLeft size={18} color={palette.textGray} />
                    </TouchableOpacity>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {format(weekStart, "MMM d", { locale: dateFnsLocale })}
                        {" – "}
                        {format(weekEnd, "MMM d", { locale: dateFnsLocale })}
                      </Text>
                      {!isCurrentWeekNow && (
                        <TouchableOpacity
                          className="rounded-full bg-emerald-100 px-2.5 py-1 dark:bg-emerald-900/30"
                          onPress={() => {
                            setCurrentWeek(new Date());
                            setSelectedWeekDate(
                              format(new Date(), "yyyy-MM-dd"),
                            );
                          }}
                          activeOpacity={0.7}
                        >
                          <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            {t("calendar.today")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity
                      className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800"
                      onPress={() => {
                        setCurrentWeek((p) => addWeeks(p, 1));
                        setSelectedWeekDate(null);
                      }}
                      activeOpacity={0.6}
                    >
                      <ChevronRight size={18} color={palette.textGray} />
                    </TouchableOpacity>
                  </View>

                  {/* Day strip */}
                  <View className="flex-row mt-2 px-0">
                    {weekDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const isToday = isDateToday(day);
                      const isSelected = selectedWeekDate === dateStr;
                      const dayEvts = dayEventMap[dateStr] ?? [];
                      const categoryColors = [
                        ...new Set(
                          dayEvts.map(
                            (e) =>
                              CATEGORY_DOT_COLORS[
                                getEventCategory(e.eventType)
                              ],
                          ),
                        ),
                      ].slice(0, 3);

                      return (
                        <TouchableOpacity
                          key={dateStr}
                          style={{
                            flex: 1,
                            alignItems: "center",
                            borderRadius: 16,
                            marginHorizontal: 2,
                            paddingVertical: 8,
                            backgroundColor: isSelected
                              ? SELECTED_DAY_COLOR
                              : isToday
                                ? scheme === "dark"
                                  ? "rgba(47,127,52,0.15)"
                                  : "#f0fdf4"
                                : "transparent",
                          }}
                          onPress={() =>
                            setSelectedWeekDate((prev) =>
                              prev === dateStr ? null : dateStr,
                            )
                          }
                          activeOpacity={0.6}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "600",
                              textTransform: "uppercase",
                              color: isSelected
                                ? "#d1fae5"
                                : isToday
                                  ? palette.primary
                                  : palette.textGray,
                            }}
                          >
                            {format(day, "EEE", { locale: dateFnsLocale })}
                          </Text>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              marginTop: 2,
                              color: isSelected
                                ? "#ffffff"
                                : isToday
                                  ? palette.primary
                                  : palette.text,
                            }}
                          >
                            {format(day, "d")}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 4,
                              gap: 3,
                              height: 8,
                            }}
                          >
                            {categoryColors.map((color, idx) => (
                              <View
                                key={idx}
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: 3,
                                  backgroundColor: isSelected
                                    ? "rgba(255,255,255,0.75)"
                                    : color,
                                }}
                              />
                            ))}
                            {dayEvts.length > 3 && (
                              <Text
                                style={{
                                  fontSize: 7,
                                  fontWeight: "700",
                                  color: isSelected
                                    ? "rgba(255,255,255,0.6)"
                                    : palette.textGray,
                                }}
                              >
                                +
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </View>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading — subtle background refresh indicator */}
        {eventsQuery.isFetching && selectedId && (
          <View className="items-center py-2">
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
        )}

        {/* Filter bar */}
        {!hideFilter && (
          <PlantEventHubFilterBar
            filter={activeFilter}
            onApply={(f) => setActiveFilter(f)}
            data={{
              applies,
              farmPlots,
              plants,
              farmZonesData: farmZonesQuery.data ?? [],
              farmZonesLoading: farmZonesQuery.isLoading,
              primaryColor: palette.primary,
            }}
          />
        )}

        {/* No target */}
        {!selectedId && renderNoTarget()}

        {/* View content */}
        {selectedId && (
          <>
            {activeView === "month" && renderMonthContent()}
            {activeView === "week" && renderWeekContent()}
            {activeView === "timeline" && renderTimelineContent()}
          </>
        )}
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      {selectedId && (
        <TouchableOpacity
          className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg"
          onPress={handleAddEvent}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* ── ApplyPlan success prompt ────────────────────────────────── */}
      {pendingCompleteApply && (
        <SuccessPromptModal
          visible={true}
          applyId={pendingCompleteApply.applyId}
          planName={pendingCompleteApply.planName}
          onClose={() => setPendingCompleteApply(null)}
          onComplete={() => setPendingCompleteApply(null)}
        />
      )}
    </View>
  );
}

export default PlantEventHubScreen;
