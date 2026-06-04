import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CalendarDays, ArrowRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import {
  usePlantEventsCalendar,
  useToggleTaskMutation,
  useUpdatePlantEventMutation,
} from "../../plant-event/queries";
import { PlantEventHubCategorySection } from "../../plant-event/components/PlantEventHubCategorySection";
import { PlantEventHubFilterBar, type FilterState } from "../../plant-event/components/PlantEventHubFilterBar";
import type { PlantEventResponse, EventCategory } from "../../plant-event/components/plant-event.types";
import { EVENT_CATEGORY_MAP } from "../../plant-event/components/plant-event.types";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { useFarmPlotsByOwner, useFarmZonesByPlot } from "../../farm/queries";
import { usePlants } from "../../plant/queries";
import { useMyApplies } from "../../plan/queries/plan.queries";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

export function TodayTasksSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profileId } = useAuthContext();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // ── Filter state ──────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<FilterState>({
    farmPlotId: "",
    farmZoneId: "",
    plantId: "",
    targetType: "",
    eventType: "",
    selectedApplyId: "",
  });

  // ── Data hooks ───────────────────────────────────────────────────────
  const farmPlotsQuery = useFarmPlotsByOwner(profileId ?? "");
  const plantsQuery = usePlants({ page: 0, size: 100 });
  const farmZonesQuery = useFarmZonesByPlot(activeFilter.farmPlotId);
  const appliesQuery = useMyApplies({ size: 100 });
  const farmPlots = farmPlotsQuery.data ?? [];
  const plants = plantsQuery.data?.content ?? [];
  const applies = appliesQuery.data?.content ?? [];

  // ── Calendar query with filters ──────────────────────────────────────
  const { data: events = [], isLoading } = usePlantEventsCalendar({
    ...(profileId ? { profileId } : {}),
    startDate: todayStr,
    endDate: todayStr,
    ...(activeFilter.farmPlotId ? { farmPlotId: activeFilter.farmPlotId } : {}),
    ...(activeFilter.farmZoneId ? { farmZoneId: activeFilter.farmZoneId } : {}),
    ...(activeFilter.plantId ? { plantId: activeFilter.plantId } : {}),
    ...(activeFilter.eventType ? { eventType: activeFilter.eventType } : {}),
    ...(activeFilter.selectedApplyId ? { planApplyId: activeFilter.selectedApplyId } : {}),
  });

  const updateEventMutation = useUpdatePlantEventMutation();
  const toggleTaskMutation = useToggleTaskMutation();

  const handleToggleComplete = (event: PlantEventResponse) => {
    updateEventMutation.mutate({
      eventId: event.id,
      body: { completed: !event.completed },
    });
  };

  const handleToggleTask = (event: PlantEventResponse, taskIndex: number) => {
    toggleTaskMutation.mutate({ eventId: event.id, taskIndex });
  };

  const handleNavigateToEvent = (eventId: string) => {
    router.push(`/(main)/plant-events/${eventId}`);
  };

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
    
    const CATEGORY_ORDER: EventCategory[] = [
      "ROUTINE_CARE",
      "HEALTH_MEDICAL",
      "GROWTH_LIFECYCLE",
    ];

    return (
      <View className="gap-4">
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
      </View>
    );
  };

  return (
    <View className="px-5 mb-5">
      <View className="flex-row justify-between items-end mb-4">
        <View>
          <Text className="text-base font-black text-slate-900 dark:text-white">
            {t("plantManagement.overview.todayTasksTitle", "Today's Tasks")}
          </Text>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {events.length > 0 
              ? `${events.length} ${t("plantManagement.overview.tasksScheduled", "tasks scheduled")}`
              : t("plantManagement.overview.noTasks", "Take a rest")}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {/* Calendar button */}
          <TouchableOpacity 
            onPress={() => router.push("/(main)/plant-events/calendar")}
            className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full"
          >
            <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mr-1">
              {t("plantManagement.overview.viewAll", "Calendar")}
            </Text>
            <ArrowRight size={14} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 min-h-[160px]">
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator color="#059669" size="large" />
          </View>
        ) : events.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 mb-3">
              <CalendarDays size={28} color="#94a3b8" strokeWidth={1.5} />
            </View>
            <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 text-center">
              {t("plantManagement.overview.todayTasksEmpty", "No tasks scheduled for today")}
            </Text>
          </View>
        ) : (
          renderGroupedEvents(events)
        )}
      </View>

      {/* Filter bar */}
      <View className="mt-3">
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
      </View>
    </View>
  );
}
