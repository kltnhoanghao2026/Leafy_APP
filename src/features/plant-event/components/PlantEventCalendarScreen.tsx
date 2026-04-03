import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import type { MarkedDates } from "react-native-calendars/src/types";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  List,
  MapPin,
  Plus,
  Sprout,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";

import type {
  CalendarParams,
  EventTargetType,
  PlantEventResponse,
} from "./plant-event.types";
import {
  getEventCategoryColors,
  getEventCategory,
  type EventCategory,
} from "./plant-event.types";
import { usePlantEventsCalendar } from "../queries";
import { usePlants } from "../../plant/queries";
import { useFarmPlotsByOwner, useFarmZonesByPlot } from "../../farm/queries";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import Colors from "@/src/constants/Colors";

import { CATEGORY_DOT_COLORS, initCalendarLocale } from "./calendarConstants";
import { EventCard } from "./EventCard";
import { EventTypeLegend } from "./EventTypeLegend";
import { TargetPickerDropdown } from "./TargetPickerDropdown";

// ── Color mapping for calendar dots ─────────────────────────────────────

const SELECTED_DAY_COLOR = "#2F7F34";

export function PlantEventCalendarScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { profileId } = useAuthContext();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  // ── Sync Locale with Calendar ────────────────────────────────────────
  const dateFnsLocale = initCalendarLocale(i18n.language);

  // ── State ──────────────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<EventTargetType>("FARM_PLOT");
  const [selectedId, setSelectedId] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPlotIdForZones, setSelectedPlotIdForZones] = useState("");

  // ── Data hooks ─────────────────────────────────────────────────────────
  const farmPlotsQuery = useFarmPlotsByOwner(profileId ?? "");
  const plantsQuery = usePlants({ page: 0, size: 100 });
  const farmZonesQuery = useFarmZonesByPlot(selectedPlotIdForZones);

  const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const calendarParams: CalendarParams = useMemo(
    () => ({
      ...(targetType === "FARM_PLOT"
        ? { farmPlotId: selectedId }
        : targetType === "FARM_ZONE"
          ? { farmZoneId: selectedId }
          : { plantId: selectedId }),
      startDate: monthStart,
      endDate: monthEnd,
    }),
    [targetType, selectedId, monthStart, monthEnd],
  );

  const eventsQuery = usePlantEventsCalendar(calendarParams);
  const events = eventsQuery.data ?? [];

  // ── Build marked dates ─────────────────────────────────────────────────
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const today = format(new Date(), "yyyy-MM-dd");

    // Initialize marks with events
    for (const event of events) {
      const start = event.calculatedStartDate;
      const end = event.calculatedEndDate ?? start;
      if (!start) continue;

      const category = getEventCategory(event.eventType);
      const dotColor = CATEGORY_DOT_COLORS[category];

      // Mark each day the event spans
      const startD = new Date(start);
      const endD = new Date(end!);
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = format(d, "yyyy-MM-dd");
        if (!marks[key]) {
          marks[key] = {
            events: [],
            selected: false,
            isToday: key === today,
          };
        }

        // Prevent duplicate event visually on the same day simply by adding
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

    // Highlight selected date
    if (selectedDate) {
      if (!marks[selectedDate]) {
        marks[selectedDate] = {
          events: [],
          selected: true,
          isToday: selectedDate === today,
        };
      } else {
        marks[selectedDate].selected = true;
      }
    }

    // Safely mark today if not already marked
    if (!marks[today]) {
      marks[today] = { events: [], selected: false, isToday: true };
    }

    return marks;
  }, [events, selectedDate]);

  // ── Events for selected date ───────────────────────────────────────────
  const selectedDayEvents: PlantEventResponse[] = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => {
      const start = e.calculatedStartDate;
      const end = e.calculatedEndDate ?? start;
      return start && start <= selectedDate && (end ?? start) >= selectedDate;
    });
  }, [events, selectedDate]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleMonthChange = useCallback((direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1),
    );
    setSelectedDate(null);
  }, []);

  const handleSelectTarget = (
    id: string,
    name: string,
    type: EventTargetType,
  ) => {
    setTargetType(type);
    setSelectedId(id);
    setSelectedName(name);
    setShowPicker(false);
    setSelectedDate(null);
  };

  const handleNavigateToEvent = (eventId: string) => {
    router.push(`/(main)/plant-events/edit/${eventId}`);
  };

  const handleAddEvent = () => {
    if (targetType === "FARM_PLOT" && selectedId) {
      router.push({
        pathname: "/(main)/plant-events/add",
        params: {
          farmPlotId: selectedId,
          farmPlotName: selectedName,
          targetType: "FARM_PLOT",
          ...(selectedDate ? { calculatedStartDate: selectedDate } : {}),
        },
      });
    } else if (targetType === "FARM_ZONE" && selectedId) {
      router.push({
        pathname: "/(main)/plant-events/add",
        params: {
          farmZoneId: selectedId,
          farmZoneName: selectedName,
          targetType: "FARM_ZONE",
          ...(selectedDate ? { calculatedStartDate: selectedDate } : {}),
        },
      });
    } else if (targetType === "PLANT" && selectedId) {
      router.push({
        pathname: "/(main)/plant-events/add",
        params: {
          plantId: selectedId,
          plantName: selectedName,
          targetType: "PLANT",
          ...(selectedDate ? { calculatedStartDate: selectedDate } : {}),
        },
      });
    }
  };

  // ── Calendar theme ─────────────────────────────────────────────────────
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

  // ── Auto-select first farm plot ────────────────────────────────────────
  const farmPlots = farmPlotsQuery.data ?? [];
  const plants = plantsQuery.data?.content ?? [];

  useEffect(() => {
    if (selectedId || farmPlots.length === 0) return;
    const first = farmPlots[0];
    setSelectedId(first.id);
    setSelectedName(first.name);
    setTargetType("FARM_PLOT");
  }, [selectedId, farmPlots]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Target Selector ───────────────────────────────────────── */}
        <View className="mx-4 mt-4 mb-2">
          {/* Target Dropdown */}
          <TouchableOpacity
            className="flex-row items-center rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900"
            onPress={() => setShowPicker(!showPicker)}
            activeOpacity={0.7}
          >
            {targetType === "FARM_PLOT" ? (
              <MapPin size={18} color={palette.primary} />
            ) : targetType === "FARM_ZONE" ? (
              <Layers size={18} color={palette.primary} />
            ) : (
              <Sprout size={18} color={palette.primary} />
            )}
            <View className="ml-3 flex-1">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {targetType === "FARM_PLOT"
                  ? t("calendar.targetFarmPlot")
                  : targetType === "FARM_ZONE"
                    ? t("calendar.targetFarmZone")
                    : t("calendar.targetPlant")}
              </Text>
              <Text
                className="text-sm font-bold text-slate-800 dark:text-slate-100"
                numberOfLines={1}
              >
                {selectedName || t("calendar.selectTarget")}
              </Text>
            </View>
            <ChevronRight size={16} color={palette.textGray} />
          </TouchableOpacity>

          {/* View Switcher */}
          <View className="flex-row mt-3 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {/* Month — active (current screen) */}
            <View className="flex-1 items-center gap-0.5 rounded-lg bg-white py-2 shadow-sm dark:bg-slate-700">
              <CalendarDays size={16} color={palette.primary} />
              <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                {t("calendar.monthView")}
              </Text>
            </View>

            {/* Week */}
            <TouchableOpacity
              className="flex-1 items-center gap-0.5 rounded-lg py-2"
              onPress={() =>
                router.push({
                  pathname: "/(main)/plant-events-week",
                  params: { targetType, selectedId, selectedName },
                })
              }
              activeOpacity={0.7}
            >
              <CalendarRange size={16} color={palette.textGray} />
              <Text className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {t("calendar.weekView")}
              </Text>
            </TouchableOpacity>

            {/* List */}
            <TouchableOpacity
              className="flex-1 items-center gap-0.5 rounded-lg py-2"
              onPress={() =>
                router.push({
                  pathname: "/(main)/plant-events",
                  params:
                    targetType === "FARM_PLOT"
                      ? {
                          farmPlotId: selectedId,
                          farmPlotName: selectedName,
                          targetType: "FARM_PLOT",
                        }
                      : targetType === "FARM_ZONE"
                        ? {
                            farmZoneId: selectedId,
                            farmZoneName: selectedName,
                            targetType: "FARM_ZONE",
                          }
                        : {
                            plantId: selectedId,
                            plantName: selectedName,
                            targetType: "PLANT",
                          },
                })
              }
              activeOpacity={0.7}
            >
              <List size={16} color={palette.textGray} />
              <Text className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {t("calendar.listView")}
              </Text>
            </TouchableOpacity>

            {/* Timeline */}
            <TouchableOpacity
              className="flex-1 items-center gap-0.5 rounded-lg py-2"
              onPress={() =>
                router.push({
                  pathname: "/(main)/plant-events-timeline",
                  params:
                    targetType === "FARM_PLOT"
                      ? {
                          farmPlotId: selectedId,
                          farmPlotName: selectedName,
                          targetType: "FARM_PLOT",
                        }
                      : targetType === "FARM_ZONE"
                        ? {
                            farmZoneId: selectedId,
                            farmZoneName: selectedName,
                            targetType: "FARM_ZONE",
                          }
                        : {
                            plantId: selectedId,
                            plantName: selectedName,
                            targetType: "PLANT",
                          },
                })
              }
              activeOpacity={0.7}
            >
              <Clock size={16} color={palette.textGray} />
              <Text className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {t("calendar.timelineShort")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Picker Dropdown ───────────────────────────────────────── */}
        {showPicker && (
          <View className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <TargetPickerDropdown
              targetType={targetType}
              setTargetType={setTargetType}
              selectedId={selectedId}
              farmPlots={farmPlots}
              plants={plants}
              farmZonesData={farmZonesQuery.data ?? []}
              farmZonesLoading={farmZonesQuery.isLoading}
              selectedPlotIdForZones={selectedPlotIdForZones}
              setSelectedPlotIdForZones={setSelectedPlotIdForZones}
              onSelectTarget={handleSelectTarget}
              primaryColor={palette.primary}
            />
          </View>
        )}

        {/* ── Calendar ──────────────────────────────────────────────── */}
        <View className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          {/* Navigation header */}
          <View className="flex-row items-center justify-between px-4 pt-4 pb-1">
            <TouchableOpacity
              className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
              onPress={() => handleMonthChange("prev")}
            >
              <ChevronLeft
                size={18}
                className="text-slate-600 dark:text-slate-300"
              />
            </TouchableOpacity>

            <View className="flex-1 items-center">
              <Text className="text-base font-bold text-slate-800 dark:text-slate-100 capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: dateFnsLocale })}
              </Text>
            </View>

            <TouchableOpacity
              className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
              onPress={() => handleMonthChange("next")}
            >
              <ChevronRight
                size={18}
                className="text-slate-600 dark:text-slate-300"
              />
            </TouchableOpacity>
          </View>

          {/* ── Month Calendar ─────────────────────────────────────── */}
          <Calendar
            key={`${monthStart}-${scheme}`}
            current={monthStart}
            markedDates={markedDates}
            onDayPress={handleDayPress}
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

              // Deduplicate dots by category color, max 3
              const uniqueColors: string[] = [];
              for (const evt of dayEvents) {
                if (!uniqueColors.includes(evt.color))
                  uniqueColors.push(evt.color);
              }
              const dots = uniqueColors.slice(0, 3);
              const hasMore = uniqueColors.length > 3;

              return (
                <TouchableOpacity
                  onPress={() => date?.dateString && handleDayPress(date)}
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

                  {/* Category dots */}
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

          {/* Legend */}
          <EventTypeLegend />
        </View>

        {/* ── Loading ───────────────────────────────────────────────── */}
        {eventsQuery.isLoading && selectedId && (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
        )}

        {/* ── No target selected ────────────────────────────────────── */}
        {!selectedId && (
          <View className="mx-4 items-center rounded-2xl bg-white py-10 shadow-sm dark:bg-slate-900">
            <MapPin size={40} className="text-slate-300 dark:text-slate-600" />
            <Text className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t("calendar.selectTarget")}
            </Text>
            <Text className="mt-1 px-8 text-center text-xs text-slate-400 dark:text-slate-500">
              {t("calendar.selectTargetHint")}
            </Text>
          </View>
        )}

        {/* ── Selected Date Events ──────────────────────────────────── */}
        {selectedDate && (
          <View className="mx-4 mb-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
                {format(
                  new Date(selectedDate + "T00:00:00"),
                  "EEEE, MMM d, yyyy",
                  { locale: dateFnsLocale },
                )}
              </Text>
              <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {selectedDayEvents.length}{" "}
                {selectedDayEvents.length === 1
                  ? t("calendar.event")
                  : t("calendar.events")}
              </Text>
            </View>

            {selectedDayEvents.length === 0 ? (
              <View className="items-center rounded-2xl bg-white py-8 shadow-sm dark:bg-slate-900">
                <Text className="text-sm text-slate-400 dark:text-slate-500">
                  {t("calendar.noEventsOnDay")}
                </Text>
              </View>
            ) : (
              selectedDayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPressEvent={handleNavigateToEvent}
                />
              ))
            )}
          </View>
        )}

        {/* ── All events summary (when no date selected) ────────────── */}
        {!selectedDate && selectedId && !eventsQuery.isLoading && (
          <View className="mx-4 mb-3">
            <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              {t("calendar.upcomingEvents")}
            </Text>
            {events.length === 0 ? (
              <View className="items-center rounded-2xl bg-white py-8 shadow-sm dark:bg-slate-900">
                <Text className="text-sm text-slate-400 dark:text-slate-500">
                  {t("calendar.noEventsThisMonth")}
                </Text>
              </View>
            ) : (
              events
                .sort((a, b) =>
                  (a.calculatedStartDate ?? "").localeCompare(
                    b.calculatedStartDate ?? "",
                  ),
                )
                .slice(0, 10)
                .map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPressEvent={handleNavigateToEvent}
                  />
                ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── FAB: Add Event ──────────────────────────────────────────── */}
      {selectedId && (
        <TouchableOpacity
          className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg"
          onPress={handleAddEvent}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default PlantEventCalendarScreen;
