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
import { useRouter, useLocalSearchParams } from "expo-router";
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
import { usePlantEventsCalendar } from "../queries";
import { usePlants } from "../../plant/queries";
import { useFarmPlotsByOwner, useFarmZonesByPlot } from "../../farm/queries";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import Colors from "@/src/constants/Colors";

import { initCalendarLocale } from "./calendarConstants";
import { EventCard } from "./EventCard";
import { EventTypeLegend } from "./EventTypeLegend";
import { TargetPickerDropdown } from "./TargetPickerDropdown";

export function PlantEventTimelineScreen() {
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

  // ── State ──────────────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  // ── Build event-count map per day ──────────────────────────────────────
  const groupedEvents: Record<string, PlantEventResponse[]> = useMemo(() => {
    const map: Record<string, PlantEventResponse[]> = {};
    const sorted = [...events].sort((a, b) =>
      (a.calculatedStartDate ?? "").localeCompare(b.calculatedStartDate ?? ""),
    );

    for (const event of sorted) {
      if (!event.calculatedStartDate) continue;
      const dateKey = event.calculatedStartDate;
      if (!map[dateKey]) map[dateKey] = [];
      // To prevent duplication in UI if they happen to overlap somehow in calendar logic
      if (!map[dateKey].some((e) => e.id === event.id)) {
        map[dateKey].push(event);
      }
    }
    return map;
  }, [events]);

  const groupedDates = Object.keys(groupedEvents).sort();

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleMonthChange = useCallback((direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1),
    );
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
        },
      });
    } else if (targetType === "FARM_ZONE" && selectedId) {
      router.push({
        pathname: "/(main)/plant-events/add",
        params: {
          farmZoneId: selectedId,
          farmZoneName: selectedName,
          targetType: "FARM_ZONE",
        },
      });
    } else if (targetType === "PLANT" && selectedId) {
      router.push({
        pathname: "/(main)/plant-events/add",
        params: {
          plantId: selectedId,
          plantName: selectedName,
          targetType: "PLANT",
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
      {/* ── Sticky Nav Strip ──────────────────────────────────────── */}
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
                pathname: "/(main)/plant-events-calendar",
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
        </View>

        {/* Month Navigation */}
        <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
          <TouchableOpacity
            className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => handleMonthChange("prev")}
            activeOpacity={0.6}
          >
            <ChevronLeft
              size={18}
              className="text-slate-600 dark:text-slate-300"
            />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100 capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: dateFnsLocale })}
            </Text>
          </View>

          <TouchableOpacity
            className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => handleMonthChange("next")}
            activeOpacity={0.6}
          >
            <ChevronRight
              size={18}
              className="text-slate-600 dark:text-slate-300"
            />
          </TouchableOpacity>
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

        {/* ── Timeline Events ───────────────────────────────────────── */}
        {selectedId && !eventsQuery.isLoading && (
          <View className="mx-4 mt-5 mb-3">
            {groupedDates.length === 0 ? (
              <View className="items-center rounded-2xl bg-white py-8 shadow-sm dark:bg-slate-900">
                <Text className="text-sm text-slate-400 dark:text-slate-500">
                  {t("calendar.noEventsThisMonth")}
                </Text>
              </View>
            ) : (
              <View className="relative">
                {/* Vertical Timeline Line */}
                <View className="absolute left-3 top-2 bottom-6 w-[2px] bg-slate-200 dark:bg-slate-800" />

                {groupedDates.map((dateStr) => {
                  const dayEvents = groupedEvents[dateStr];
                  const dateObj = new Date(dateStr + "T00:00:00");
                  return (
                    <View key={dateStr} className="mb-6">
                      <View className="mb-3 flex-row items-center">
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-100 ring-4 ring-slate-50 dark:bg-slate-800 dark:ring-slate-950">
                          <View className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </View>
                        <Text className="ml-3 text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
                          {format(dateObj, "EEEE, MMM d", {
                            locale: dateFnsLocale,
                          })}
                        </Text>
                      </View>
                      <View className="pl-9">
                        {dayEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onPressEvent={handleNavigateToEvent}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── Legend ────────────────────────────────────────────────── */}
        {selectedId && !eventsQuery.isLoading && events.length > 0 && (
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

export default PlantEventTimelineScreen;
