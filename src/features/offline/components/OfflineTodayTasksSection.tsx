import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CalendarDays, ArrowRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import { useOfflinePlantEvents, offlineKeys } from "../../offline/hooks/useOfflineQueries";
import { toggleOfflinePlantEventCompleted } from "../../offline/services/offline-query.service";

import { PlantEventHubCategorySection } from "../../plant-event/components/PlantEventHubCategorySection";
import type { PlantEventResponse, EventCategory } from "../../plant-event/components/plant-event.types";
import { EVENT_CATEGORY_MAP } from "../../plant-event/components/plant-event.types";

export function OfflineTodayTasksSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const { data: allEvents = [], isLoading } = useOfflinePlantEvents({});

  const todayEvents = useMemo(() => {
    return allEvents.filter(evt => {
      const start = evt.calculatedStartDate;
      if (!start) return false;
      
      const end = evt.calculatedEndDate ?? start;
      
      // Check if today falls within the [start, end] range
      // Because formats are yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss, string comparison works well
      // Note: we extract just the date part (first 10 chars) for safe string comparison
      const startStr = start.substring(0, 10);
      const endStr = end.substring(0, 10);
      
      return startStr <= todayStr && endStr >= todayStr;
    });
  }, [allEvents, todayStr]);

  const toggleCompleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await toggleOfflinePlantEventCompleted(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offline', 'plantEvents'] });
      queryClient.invalidateQueries({ queryKey: offlineKeys.stats() });
    },
  });

  const handleToggleComplete = (event: PlantEventResponse) => {
    toggleCompleteMutation.mutate(event.id);
  };

  const handleToggleTask = (event: PlantEventResponse, taskIndex: number) => {
    // Toggling specific tasks is not currently supported in offline SQLite easily without JSON updating.
    // We can just ignore or show a toast. For now, do nothing.
    console.log("Task toggling not fully supported offline yet.");
  };

  const handleNavigateToEvent = (eventId: string) => {
    router.push(`/(offline)/plant-events/${eventId}`);
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
      "ALERTS",
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
    <View className="px-5 mb-5 mt-6">
      <View className="flex-row justify-between items-end mb-4">
        <View>
          <Text className="text-base font-black text-slate-900 dark:text-white">
            {t("plantManagement.overview.todayTasksTitle", "Today's Tasks")}
          </Text>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {todayEvents.length > 0 
              ? `${todayEvents.length} ${t("plantManagement.overview.tasksScheduled", "tasks scheduled")}`
              : `Debug: all=${allEvents.length}, today=${todayStr}, firstDate=${allEvents[0]?.calculatedStartDate ?? 'none'}`}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push("/(offline)/plant-events")}
          className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full"
        >
          <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mr-1">
            {t("plantManagement.overview.viewAll", "Calendar")}
          </Text>
          <ArrowRight size={14} color="#059669" />
        </TouchableOpacity>
      </View>

      <View className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 min-h-[160px]">
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator color="#059669" size="large" />
          </View>
        ) : todayEvents.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 mb-3">
              <CalendarDays size={28} color="#94a3b8" strokeWidth={1.5} />
            </View>
            <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 text-center">
              {t("plantManagement.overview.todayTasksEmpty", "No tasks scheduled for today")}
            </Text>
          </View>
        ) : (
          renderGroupedEvents(todayEvents)
        )}
      </View>
    </View>
  );
}
