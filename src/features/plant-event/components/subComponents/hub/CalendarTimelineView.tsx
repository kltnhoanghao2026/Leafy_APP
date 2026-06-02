import React from "react";
import { View, Text } from "react-native";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react-native";
import { format } from "date-fns";
import { CATEGORY_DOT_COLORS } from "../../calendarConstants";
import type { PlantEventResponse } from "../../plant-event.types";

interface CalendarTimelineViewProps {
  timelineMonth: Date;
  groupedDates: string[];
  groupedEvents: Record<string, PlantEventResponse[]>;
  filteredEvents: PlantEventResponse[];
  selectedId: string;
  palette: any;
  scheme: "light" | "dark";
  dateFnsLocale: any;
  renderGroupedEvents: (evts: PlantEventResponse[]) => React.ReactNode;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  t: (key: string) => string;
}

export function CalendarTimelineView({
  timelineMonth,
  groupedDates,
  groupedEvents,
  filteredEvents,
  selectedId,
  palette,
  scheme,
  dateFnsLocale,
  renderGroupedEvents,
  onPreviousMonth,
  onNextMonth,
  t,
}: CalendarTimelineViewProps) {
  return (
    <View className="mx-4 mt-2">
      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-4 rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
        <View className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          <ChevronLeft size={18} color={palette.textGray} onPress={onPreviousMonth} />
        </View>
        <Text className="text-base font-bold text-slate-800 dark:text-slate-100 capitalize">
          {format(timelineMonth, "MMMM yyyy", { locale: dateFnsLocale })}
        </Text>
        <View className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          <ChevronRight size={18} color={palette.textGray} onPress={onNextMonth} />
        </View>
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
}
