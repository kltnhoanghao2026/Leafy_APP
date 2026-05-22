import { useMemo } from "react";
import { View, Text } from "react-native";
import { Calendar } from "react-native-calendars";
import { format, addDays } from "date-fns";
import { CalendarDays } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { PlantEventCreateRequest } from "@/src/features/plant-event/components/plant-event.types";
import {
  CATEGORY_DOT_COLORS,
  getEventCategory,
} from "@/src/features/plant-event/components/calendarConstants";
import type { PlanEventScheduleItem } from "./create-plan.types";

interface PlanPreviewCalendarProps {
  draftEvents: PlanEventScheduleItem[];
}

// Convert draft event to calendar-marked format
function toMarkedEvent(
  evt: PlanEventScheduleItem,
  idx: number,
): {
  key: string;
  startDate: Date;
  endDate: Date;
  color: string;
} | null {
  if (evt.daysFromStart == null) return null;

  const today = new Date();
  const startDate = addDays(today, evt.daysFromStart);
  const endDate =
    evt.durationDays != null && evt.durationDays > 0
      ? addDays(startDate, evt.durationDays - 1)
      : startDate;

  const color = evt.eventType
    ? CATEGORY_DOT_COLORS[getEventCategory(evt.eventType)]
    : "#22c55e";

  return {
    key: `preview-${idx}`,
    startDate,
    endDate,
    color,
  };
}

export function PlanPreviewCalendar({ draftEvents }: PlanPreviewCalendarProps) {
  const { t, i18n } = useTranslation();

  const markedDates = useMemo(() => {
    const marks: Record<
      string,
      { dots?: Array<{ key: string; color: string }>; selected?: boolean; selectedColor?: string }
    > = {};

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    draftEvents.forEach((evt, idx) => {
      const marked = toMarkedEvent(evt, idx);
      if (!marked) return;

      for (
        let day = new Date(marked.startDate);
        day <= marked.endDate;
        day = addDays(day, 1)
      ) {
        const key = format(day, "yyyy-MM-dd");
        if (!marks[key]) {
          marks[key] = { dots: [] };
        }

        const hasDot = marks[key].dots?.some(
          (dot) => dot.color === marked.color,
        );
        if (!hasDot) {
          marks[key].dots = [
            ...(marks[key].dots ?? []),
            { key: `${key}-${marked.color}`, color: marked.color },
          ];
        }
      }
    });

    // Mark today as selected
    if (!marks[todayStr]) {
      marks[todayStr] = {};
    }
    marks[todayStr].selected = true;
    marks[todayStr].selectedColor = "#2F7F34";

    return marks;
  }, [draftEvents]);

  if (draftEvents.length === 0) {
    return (
      <View className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16">
        <CalendarDays size={40} color="#cbd5e1" strokeWidth={1.5} />
        <Text className="mt-3 text-sm font-semibold text-slate-500">
          Chưa có sự kiện nào để xem trước.
        </Text>
        <Text className="mt-1 text-xs font-medium text-slate-400">
          Thêm sự kiện trong tab "Lịch trình" để xem bố cục theo tháng.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 p-3">
      <View className="mb-2 flex-row items-center gap-2">
        <CalendarDays size={16} color="#245A34" strokeWidth={2.5} />
        <Text className="text-sm font-bold text-slate-800">
          Xem trước lịch trình
        </Text>
        <Text className="text-xs text-slate-400">
          ({draftEvents.length} sự kiện)
        </Text>
      </View>

      <View className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Calendar
          markedDates={markedDates}
          markingType="multi-dot"
          hideArrows
          hideExtraDays
          renderHeader={() => (
            <View className="px-3 pt-2 pb-1">
              <Text className="text-sm font-bold text-slate-800 capitalize">
                {format(new Date(), "MMMM yyyy")}
              </Text>
            </View>
          )}
          theme={{
            backgroundColor: "transparent",
            calendarBackground: "transparent",
            textSectionTitleColor: "#64748b",
            selectedDayBackgroundColor: "#2F7F34",
            selectedDayTextColor: "#FFFFFF",
            todayTextColor: "#2F7F34",
            dayTextColor: "#1e293b",
            textDisabledColor: "#cbd5e1",
            dotColor: "#2F7F34",
            arrowColor: "#2F7F34",
            monthTextColor: "#1e293b",
            textDayFontWeight: "500",
            textMonthFontWeight: "700",
            textDayHeaderFontWeight: "600",
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          style={{ paddingHorizontal: 4, paddingBottom: 8 }}
        />
      </View>

      {/* Legend */}
      <View className="mt-3 flex-row flex-wrap items-center gap-3">
        <Text className="text-xs font-semibold text-slate-500">Chú thích:</Text>
        {[
          { category: "ROUTINE_CARE", label: "Chăm sóc" },
          { category: "HEALTH_MEDICAL", label: "Sức khỏe" },
          { category: "GROWTH_LIFECYCLE", label: "Phát triển" },
        ].map(({ category, label }) => (
          <View key={category} className="flex-row items-center gap-1">
            <View
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  CATEGORY_DOT_COLORS[category as keyof typeof CATEGORY_DOT_COLORS],
              }}
            />
            <Text className="text-[10px] text-slate-500">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
