import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { format, startOfWeek, endOfWeek, addDays, isToday as isDateToday, subWeeks, addWeeks } from "date-fns";
import { useTranslation } from "react-i18next";
import type { PlantEventResponse } from "../../plant-event.types";
import { getEventCategory, CATEGORY_DOT_COLORS } from "../../plant-event.types";

const SELECTED_DAY_COLOR = "#2F7F34";

interface WeekDayStripProps {
  currentWeek: Date;
  selectedWeekDate: string | null;
  dayEventMap: Record<string, PlantEventResponse[]>;
  onSelectDate: (dateStr: string | null) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
  palette: any;
  scheme: "light" | "dark";
  isCurrentWeekNow: boolean;
  weekStart: Date;
  weekEnd: Date;
  dateFnsLocale: any;
}

export function WeekDayStrip({
  currentWeek,
  selectedWeekDate,
  dayEventMap,
  onSelectDate,
  onPreviousWeek,
  onNextWeek,
  onGoToToday,
  palette,
  scheme,
  isCurrentWeekNow,
  weekStart,
  weekEnd,
  dateFnsLocale,
}: WeekDayStripProps) {
  const { t } = useTranslation();

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  return (
    <>
      {/* Week nav */}
      <View className="flex-row items-center justify-between mt-2">
        <TouchableOpacity
          className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800"
          onPress={onPreviousWeek}
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
          className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800"
          onPress={onNextWeek}
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
                  CATEGORY_DOT_COLORS[getEventCategory(e.eventType)],
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
                onSelectDate(prev => prev === dateStr ? null : dateStr)
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
  );
}
