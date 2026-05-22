import React from "react";
import { View, Text } from "react-native";
import { CalendarRange } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import type { PlantEventResponse } from "../../plant-event.types";
import { EventGroupedList } from "@/src/features/shared/components/EventGroupedList";

interface CalendarWeekViewProps {
  selectedWeekDate: string | null;
  selectedId: string;
  selectedWeekDateEvents: PlantEventResponse[];
  filteredEvents: PlantEventResponse[];
  palette: any;
  scheme: "light" | "dark";
  dateFnsLocale: any;
  onNavigateToEvent: (eventId: string) => void;
  onToggleComplete: (event: PlantEventResponse) => void;
  onToggleTask: (event: PlantEventResponse, taskIndex: number) => void;
  t: (key: string) => string;
}

export function CalendarWeekView({
  selectedWeekDate,
  selectedId,
  selectedWeekDateEvents,
  filteredEvents,
  palette,
  scheme,
  dateFnsLocale,
  onNavigateToEvent,
  onToggleComplete,
  onToggleTask,
  t,
}: CalendarWeekViewProps) {
  return (
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
              onPressEvent={onNavigateToEvent}
              onToggleComplete={onToggleComplete}
              onToggleTask={onToggleTask}
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
              onPressEvent={onNavigateToEvent}
              onToggleComplete={onToggleComplete}
              onToggleTask={onToggleTask}
            />
          )}
        </View>
      )}

      {/* Legend */}
      {selectedId && (
        <View className="mx-4 mb-3 flex-row items-center justify-center gap-5 rounded-2xl bg-white px-4 py-2.5 shadow-sm dark:bg-slate-900">
          {(
            ["ROUTINE_CARE", "HEALTH_MEDICAL", "GROWTH_LIFECYCLE", "ALERTS"] as const
          ).map((cat) => {
            const { CATEGORY_DOT_COLORS } = require("../../calendarConstants");
            return (
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
            );
          })}
        </View>
      )}
    </>
  );
}
