import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  List,
  MapPin,
  Plus,
  Sprout,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  format,
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
  EventTargetType,
  PlantEventResponse,
} from "./plant-event.types";
import { getEventCategory } from "./plant-event.types";
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

export function PlantEventWeekScreen() {
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

  // ── Sync Locale with Calendar ────────────────────────────────────────
  const dateFnsLocale = initCalendarLocale(i18n.language);

  // ── State ──────────────────────────────────────────────────────────────
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [targetType, setTargetType] = useState<EventTargetType>(
    (params.targetType as EventTargetType) || "FARM_PLOT",
  );
  const [selectedId, setSelectedId] = useState(params.selectedId ?? "");
  const [selectedName, setSelectedName] = useState(params.selectedName ?? "");
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPlotIdForZones, setSelectedPlotIdForZones] = useState("");

  // ── Data hooks ─────────────────────────────────────────────────────────
  const farmPlotsQuery = useFarmPlotsByOwner(profileId ?? "");
  const plantsQuery = usePlants({ page: 0, size: 100 });
  const farmZonesQuery = useFarmZonesByPlot(selectedPlotIdForZones);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStartStr],
  );

  const calendarParams: CalendarParams = useMemo(
    () => ({
      ...(profileId ? { profileId } : {}),
      ...(selectedId
        ? targetType === "FARM_PLOT"
          ? { farmPlotId: selectedId }
          : targetType === "FARM_ZONE"
            ? { farmZoneId: selectedId }
            : { plantId: selectedId }
        : {}),
      startDate: weekStartStr,
      endDate: weekEndStr,
    }),
    [targetType, selectedId, weekStartStr, weekEndStr, profileId],
  );

  const eventsQuery = usePlantEventsCalendar(calendarParams);
  const events = eventsQuery.data ?? [];

  // ── Build event-count map per day ──────────────────────────────────────
  const dayEventMap = useMemo(() => {
    const map: Record<string, PlantEventResponse[]> = {};
    for (const event of events) {
      const start = event.calculatedStartDate;
      const end = event.calculatedEndDate ?? start;
      if (!start) continue;
      const startD = new Date(start);
      const endD = new Date(end!);
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = format(d, "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        if (!map[key].some((e) => e.id === event.id)) {
          map[key].push(event);
        }
      }
    }
    return map;
  }, [events]);

  // ── Events for selected date ───────────────────────────────────────────
  const selectedDayEvents: PlantEventResponse[] = useMemo(() => {
    if (!selectedDate) return [];
    return dayEventMap[selectedDate] ?? [];
  }, [dayEventMap, selectedDate]);

  // ── Is current week "this week"? ───────────────────────────────────────
  const isCurrentWeekNow = useMemo(() => {
    const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return isSameDay(weekStart, todayWeekStart);
  }, [weekStart]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleDayPress = useCallback((dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }, []);

  const handleWeekChange = useCallback((direction: "prev" | "next") => {
    setCurrentWeek((prev) =>
      direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1),
    );
    setSelectedDate(null);
  }, []);

  const handleGoToToday = useCallback(() => {
    setCurrentWeek(new Date());
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
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
      {/* ── Sticky Week Strip ──────────────────────────────────────── */}
      <View className="bg-white pb-1 shadow-sm dark:bg-slate-900">
        {/* Target + Nav Row */}
        <View className="flex-row items-center px-4 pt-3 pb-2">
          <TouchableOpacity
            className="flex-1 flex-row items-center rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800"
            onPress={() => setShowPicker(!showPicker)}
            activeOpacity={0.7}
          >
            {targetType === "FARM_PLOT" ? (
              <MapPin
                size={18}
                className="text-emerald-600 dark:text-emerald-400"
              />
            ) : targetType === "FARM_ZONE" ? (
              <Layers
                size={18}
                className="text-emerald-600 dark:text-emerald-400"
              />
            ) : (
              <Sprout
                size={18}
                className="text-emerald-600 dark:text-emerald-400"
              />
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
            <ChevronRight
              size={16}
              className="text-slate-400 dark:text-slate-500"
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="ml-3 items-center justify-center rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
            onPress={() =>
              router.push({
                pathname: "/(main)/plant-events/calendar",
                params: { targetType, selectedId, selectedName },
              })
            }
            activeOpacity={0.7}
          >
            <CalendarDays
              size={20}
              className="text-slate-600 dark:text-slate-300"
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="ml-2 items-center justify-center rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
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
            <List size={20} className="text-slate-600 dark:text-slate-300" />
          </TouchableOpacity>

          <TouchableOpacity
            className="ml-2 items-center justify-center rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
            onPress={() =>
              router.push({
                pathname: "/(main)/plant-events/timeline",
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
            <Clock size={20} className="text-slate-600 dark:text-slate-300" />
          </TouchableOpacity>
        </View>

        {/* Week Navigation */}
        <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
          <TouchableOpacity
            className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => handleWeekChange("prev")}
            activeOpacity={0.6}
          >
            <ChevronLeft
              size={18}
              className="text-slate-600 dark:text-slate-300"
            />
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
                onPress={handleGoToToday}
                activeOpacity={0.7}
              >
                <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  {t("calendar.today") || "Today"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => handleWeekChange("next")}
            activeOpacity={0.6}
          >
            <ChevronRight
              size={18}
              className="text-slate-600 dark:text-slate-300"
            />
          </TouchableOpacity>
        </View>

        {/* ── Day Strip ────────────────────────────────────────────── */}
        <View className="flex-row px-2 pb-3">
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isToday = isDateToday(day);
            const isSelected = selectedDate === dateStr;
            const dayEvents = dayEventMap[dateStr] ?? [];
            const eventCount = dayEvents.length;

            // Gather unique category colors for dots
            const categoryColors = [
              ...new Set(
                dayEvents.map(
                  (e) => CATEGORY_DOT_COLORS[getEventCategory(e.eventType)],
                ),
              ),
            ].slice(0, 3);

            return (
              <TouchableOpacity
                key={dateStr}
                className={`flex-1 items-center rounded-2xl mx-0.5 py-2 ${
                  isSelected
                    ? "bg-emerald-600"
                    : isToday
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : ""
                }`}
                onPress={() => handleDayPress(dateStr)}
                activeOpacity={0.6}
              >
                {/* Day name */}
                <Text
                  className={`text-[10px] font-semibold uppercase ${
                    isSelected
                      ? "text-emerald-100"
                      : isToday
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {format(day, "EEE", { locale: dateFnsLocale })}
                </Text>

                {/* Date number */}
                <Text
                  className={`text-base font-bold mt-0.5 ${
                    isSelected
                      ? "text-white"
                      : isToday
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {format(day, "d")}
                </Text>

                {/* Event indicator dots */}
                <View className="flex-row items-center mt-1 gap-0.5 h-2">
                  {categoryColors.map((color, idx) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: isSelected ? "#FFFFFF" : color,
                        opacity: isSelected ? 0.8 : 1,
                      }}
                      className="w-1.5 h-1.5 rounded-full"
                    />
                  ))}
                  {eventCount > 3 && (
                    <Text
                      className={`text-[7px] font-bold ml-0.5 ${
                        isSelected
                          ? "text-white/70"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      +
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Scrollable Content ─────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Picker Dropdown ───────────────────────────────────────── */}
        {showPicker && (
          <View className="mx-4 mt-3 mb-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
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

        {/* ── Loading ───────────────────────────────────────────────── */}
        {eventsQuery.isLoading && selectedId && (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
        )}

        {/* ── No target selected ────────────────────────────────────── */}
        {!selectedId && (
          <View className="mx-4 mt-4 items-center rounded-2xl bg-white py-10 shadow-sm dark:bg-slate-900">
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
        {selectedDate && selectedId && !eventsQuery.isLoading && (
          <View className="mx-4 mt-3 mb-3">
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
          <View className="mx-4 mt-3 mb-3">
            <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              {t("calendar.eventsThisWeek")}
            </Text>
            {events.length === 0 ? (
              <View className="items-center rounded-2xl bg-white py-8 shadow-sm dark:bg-slate-900">
                <Text className="text-sm text-slate-400 dark:text-slate-500">
                  {t("calendar.noEventsThisWeek")}
                </Text>
              </View>
            ) : (
              events
                .sort((a, b) =>
                  (a.calculatedStartDate ?? "").localeCompare(
                    b.calculatedStartDate ?? "",
                  ),
                )
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

        {/* ── Legend ────────────────────────────────────────────────── */}
        {selectedId && !eventsQuery.isLoading && (
          <View className="mx-4 mb-3 rounded-2xl bg-white shadow-sm dark:bg-slate-900">
            <EventTypeLegend />
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

export default PlantEventWeekScreen;
