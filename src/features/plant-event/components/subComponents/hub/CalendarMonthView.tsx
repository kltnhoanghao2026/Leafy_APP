import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { format, subMonths, addMonths } from "date-fns";
import { useTranslation } from "react-i18next";
import { CATEGORY_DOT_COLORS } from "../../calendarConstants";
import type { PlantEventResponse } from "../../plant-event.types";
import { getEventCategory } from "../../plant-event.types";
import { EventGroupedList } from "@/src/features/shared/components/EventGroupedList";

const SELECTED_DAY_COLOR = "#2F7F34";

interface CalendarMonthViewProps {
  currentMonth: Date;
  selectedMonthDate: string | null;
  markedDates: Record<string, any>;
  filteredEvents: PlantEventResponse[];
  selectedId: string;
  eventsQuery: any;
  palette: any;
  scheme: "light" | "dark";
  calendarTheme: any;
  monthStart: string;
  dateFnsLocale: any;
  isCurrentMonthNow: boolean;
  onMonthChange: (date: Date) => void;
  onDateSelect: (dateStr: string) => void;
  onNavigateToEvent: (eventId: string) => void;
  onToggleComplete: (event: PlantEventResponse) => void;
  onToggleTask: (event: PlantEventResponse, taskIndex: number) => void;
  onGoToToday: () => void;
  t: (key: string) => string;
  selectedMonthDateEvents: PlantEventResponse[];
}

export function CalendarMonthView({
  currentMonth,
  selectedMonthDate,
  markedDates,
  filteredEvents,
  selectedId,
  eventsQuery,
  palette,
  scheme,
  calendarTheme,
  monthStart,
  dateFnsLocale,
  isCurrentMonthNow,
  onMonthChange,
  onDateSelect,
  onNavigateToEvent,
  onToggleComplete,
  onToggleTask,
  onGoToToday,
  t,
  selectedMonthDateEvents,
}: CalendarMonthViewProps) {
  return (
    <>
      <View className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
        {/* Month navigation */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
          <TouchableOpacity
            className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => {
              onMonthChange(subMonths(currentMonth, 1));
              onDateSelect("");
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
                onPress={onGoToToday}
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
              onMonthChange(addMonths(currentMonth, 1));
              onDateSelect("");
            }}
          >
            <ChevronRight size={18} color={palette.textGray} />
          </TouchableOpacity>
        </View>

        <Calendar
          key={`${monthStart}-${scheme}`}
          current={monthStart}
          markedDates={markedDates}
          onDayPress={(day: DateData) => onDateSelect(day.dateString)}
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
                  date?.dateString && onDateSelect(date.dateString)
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
              onPressEvent={onNavigateToEvent}
              onToggleComplete={onToggleComplete}
              onToggleTask={onToggleTask}
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
              onPressEvent={onNavigateToEvent}
              onToggleComplete={onToggleComplete}
              onToggleTask={onToggleTask}
            />
          )}
        </View>
      )}
    </>
  );
}
