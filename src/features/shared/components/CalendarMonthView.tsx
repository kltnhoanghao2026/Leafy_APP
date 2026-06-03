import { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { vi as viDate } from "date-fns/locale";

import type { PlantEventResponse } from "@/src/features/plant-event";
import { getEventCategory } from "@/src/features/plant-event";
import { CATEGORY_DOT_COLORS } from "@/src/features/plant-event/components/calendarConstants";

const SELECTED_DAY_COLOR = "#2F7F34";

export type CalendarMonthViewProps = {
  events: PlantEventResponse[];
  currentMonth: Date;
  selectedDate: string | null;
  onMonthChange: (month: Date) => void;
  onDateSelect: (dateString: string | null) => void;
  dateFnsLocale?: Locale;
  scheme?: "light" | "dark";
  primaryColor?: string;
  textColor?: string;
  textGrayColor?: string;
  placeholderColor?: string;
};

export function CalendarMonthView({
  events: eventsProp = [],
  currentMonth,
  selectedDate,
  onMonthChange,
  onDateSelect,
  dateFnsLocale = viDate,
  scheme = "light",
  primaryColor = "#059669",
  textColor = "#1e293b",
  textGrayColor = "#64748b",
  placeholderColor = "#94a3b8",
}: CalendarMonthViewProps) {
  const events: PlantEventResponse[] = Array.isArray(eventsProp) ? eventsProp : [];
  const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");

  const isCurrentMonthNow = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === currentMonth.getFullYear() && now.getMonth() === currentMonth.getMonth();
  }, [currentMonth]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const today = format(new Date(), "yyyy-MM-dd");

    for (const event of events) {
      const start = event.calculatedStartDate;
      const end = event.calculatedEndDate ?? start;
      if (!start) continue;
      const category = getEventCategory(event.eventType);
      const dotColor = CATEGORY_DOT_COLORS[category];
      const startD = new Date(start);
      const endD = new Date(end!);
      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const key = format(d, "yyyy-MM-dd");
        if (!marks[key]) {
          marks[key] = { events: [], selected: false, isToday: key === today };
        }
        if (!marks[key].events.some((e: any) => e.id === event.id)) {
          marks[key].events.push({ id: event.id, type: event.eventType, category, color: dotColor });
        }
      }
    }
    if (selectedDate) {
      if (!marks[selectedDate]) {
        marks[selectedDate] = { events: [], selected: false, isToday: selectedDate === today };
      }
      marks[selectedDate].selected = true;
    }
    if (!marks[today]) {
      marks[today] = { events: [], selected: false, isToday: true };
    }
    return marks;
  }, [events, selectedDate]);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: "transparent",
      calendarBackground: "transparent",
      selectedDayBackgroundColor: SELECTED_DAY_COLOR,
      selectedDayTextColor: "#FFFFFF",
      todayTextColor: primaryColor,
      dayTextColor: textColor,
      textDisabledColor: placeholderColor,
      dotColor: primaryColor,
      arrowColor: primaryColor,
      monthTextColor: textColor,
      textDayFontWeight: "500" as const,
      textMonthFontWeight: "700" as const,
      textDayHeaderFontWeight: "600" as const,
      textDayFontSize: 14,
      textMonthFontSize: 16,
      textDayHeaderFontSize: 12,
    }),
    [primaryColor, textColor, placeholderColor],
  );

  return (
    <>
      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
          onPress={() => { onMonthChange(subMonths(currentMonth, 1)); onDateSelect(null); }}
          activeOpacity={0.6}
        >
          <ChevronLeft size={18} color={textGrayColor} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: dateFnsLocale })}
          </Text>
          {!isCurrentMonthNow && (
            <TouchableOpacity
              className="rounded-full bg-emerald-100 px-2.5 py-1 dark:bg-emerald-900/30"
              onPress={() => { onMonthChange(new Date()); onDateSelect(null); }}
              activeOpacity={0.7}
            >
              <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Hôm nay</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
          onPress={() => { onMonthChange(addMonths(currentMonth, 1)); onDateSelect(null); }}
          activeOpacity={0.6}
        >
          <ChevronRight size={18} color={textGrayColor} />
        </TouchableOpacity>
      </View>

      {/* Calendar grid */}
      <Calendar
        key={`${monthStart}-${scheme}`}
        current={monthStart}
        markedDates={markedDates}
        onDayPress={(day: DateData) => onDateSelect(selectedDate === day.dateString ? null : day.dateString)}
        hideArrows
        hideExtraDays
        renderHeader={() => null}
        theme={calendarTheme}
        style={{ paddingHorizontal: 4 }}
        dayComponent={({ date, state, marking }: any) => {
          const isSelected = marking?.selected;
          const isToday = marking?.isToday || state === "today";
          const dayEvents = marking?.events ?? [];
          const isTrailing = state === "disabled";
          const uniqueColors: string[] = [];
          for (const evt of dayEvents) {
            if (!uniqueColors.includes(evt.color)) uniqueColors.push(evt.color);
          }
          const dots = uniqueColors.slice(0, 3);

          return (
            <TouchableOpacity
              onPress={() => date?.dateString && onDateSelect(selectedDate === date.dateString ? null : date.dateString)}
              activeOpacity={0.6}
              style={{
                width: 44, alignItems: "center", paddingVertical: 4,
                borderRadius: 10, borderWidth: 1, borderColor: isSelected ? "#86efac" : "transparent",
                backgroundColor: isSelected ? "#f0fdf4" : "transparent",
              }}
            >
              <View
                style={{
                  width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center",
                  backgroundColor: isSelected ? SELECTED_DAY_COLOR : isToday ? "rgba(47,127,52,0.12)" : "transparent",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: isSelected || isToday ? "700" : "500", color: isSelected ? "#ffffff" : isTrailing ? "#cbd5e1" : isToday ? primaryColor : textColor }}>
                  {date?.day}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 4, height: 6, gap: 2 }}>
                {dots.map((color: string, i: number) => (
                  <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />
                ))}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Legend */}
      <View className="flex-row items-center justify-center gap-5 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 mt-1">
        {(["ROUTINE_CARE", "HEALTH_MEDICAL", "GROWTH_LIFECYCLE"] as const).map((cat) => (
          <View key={cat} className="flex-row items-center gap-1.5">
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: CATEGORY_DOT_COLORS[cat] }} />
            <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {cat === "ROUTINE_CARE" ? "Chăm sóc" : cat === "HEALTH_MEDICAL" ? "Sức khỏe" : "Phát triển"}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}
