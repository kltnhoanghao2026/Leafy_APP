import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { EventCard } from "./EventCard";
import type {
  EventCategory,
  PlantEventResponse,
} from "./plant-event.types";

// ── Helpers (mirroring FE GroupedEventList) ───────────────────────────────

/** Recursively count all events (including nested children). */
function countAllEvents(events: PlantEventResponse[]): number {
  let count = 0;
  for (const e of events) {
    count += 1;
    if (e.children && e.children.length > 0) {
      count += countAllEvents(e.children);
    }
  }
  return count;
}

/** Check if a single event is considered done. */
function isEventDone(e: PlantEventResponse): boolean {
  if (e.trackingGranularity && e.trackingGranularity !== "NONE") {
    return (
      e.progressTotal != null &&
      e.progressTotal > 0 &&
      e.progressCompleted === e.progressTotal
    );
  }
  return e.completed;
}

/** Recursively count done events (including nested children). */
function countDoneEvents(events: PlantEventResponse[]): number {
  let count = 0;
  for (const e of events) {
    if (isEventDone(e)) count += 1;
    if (e.children && e.children.length > 0) {
      count += countDoneEvents(e.children);
    }
  }
  return count;
}

// ── Category accent styles ───────────────────────────────────────────────

const CATEGORY_ACCENT: Record<
  EventCategory,
  {
    border: string;
    headerBg: string;
    countBg: string;
    countText: string;
    doneBg: string;
    doneText: string;
  }
> = {
  ROUTINE_CARE: {
    border: "border-blue-200 dark:border-blue-800",
    headerBg: "bg-blue-50 dark:bg-blue-900/20",
    countBg: "bg-blue-100 dark:bg-blue-800/40",
    countText: "text-blue-600 dark:text-blue-400",
    doneBg: "bg-emerald-100 dark:bg-emerald-800/40",
    doneText: "text-emerald-600 dark:text-emerald-400",
  },
  HEALTH_MEDICAL: {
    border: "border-orange-200 dark:border-orange-800",
    headerBg: "bg-orange-50 dark:bg-orange-900/20",
    countBg: "bg-orange-100 dark:bg-orange-800/40",
    countText: "text-orange-600 dark:text-orange-400",
    doneBg: "bg-emerald-100 dark:bg-emerald-800/40",
    doneText: "text-emerald-600 dark:text-emerald-400",
  },
  GROWTH_LIFECYCLE: {
    border: "border-emerald-200 dark:border-emerald-800",
    headerBg: "bg-emerald-50 dark:bg-emerald-900/20",
    countBg: "bg-emerald-100 dark:bg-emerald-800/40",
    countText: "text-emerald-600 dark:text-emerald-400",
    doneBg: "bg-emerald-100 dark:bg-emerald-800/40",
    doneText: "text-emerald-600 dark:text-emerald-400",
  },
};

type PlantEventHubCategorySectionProps = {
  category: EventCategory;
  events: PlantEventResponse[];
  onPressEvent?: (eventId: string) => void;
  onToggleComplete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
};

export function PlantEventHubCategorySection({
  category,
  events,
  onPressEvent,
  onToggleComplete,
  onToggleTask,
}: PlantEventHubCategorySectionProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const accent = CATEGORY_ACCENT[category];

  // Compute done count recursively (including nested children).
  const totalCount = countAllEvents(events);
  const doneCount = countDoneEvents(events);
  const allDone = doneCount === totalCount && totalCount > 0;

  return (
    <View
      className={`mb-2 overflow-hidden rounded-2xl border ${accent.border}`}
    >
      <TouchableOpacity
        className={`flex-row items-center justify-between px-3 py-2.5 ${accent.headerBg}`}
        onPress={() => setCollapsed((value) => !value)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {t(`plantEvent.eventCategory.${category}`)}
          </Text>
          <View
            className={`rounded-full px-1.5 py-0.5 ${allDone ? accent.doneBg : accent.countBg}`}
          >
            <Text
              className={`text-[10px] font-bold ${allDone ? accent.doneText : accent.countText}`}
            >
              {doneCount}/{totalCount}
            </Text>
          </View>
        </View>

        {collapsed ? (
          <ChevronDown
            size={14}
            color="#94a3b8"
          />
        ) : (
          <ChevronUp
            size={14}
            color="#94a3b8"
          />
        )}
      </TouchableOpacity>

      {!collapsed && (
        <View className="px-2 pt-1 pb-2">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPressEvent={onPressEvent}
              onToggleComplete={onToggleComplete}
              onToggleTask={onToggleTask}
            />
          ))}
        </View>
      )}
    </View>
  );
}
