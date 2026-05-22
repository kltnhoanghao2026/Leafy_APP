import { View, Text, ActivityIndicator } from "react-native";
import { CalendarDays } from "lucide-react-native";

import type { PlantEventResponse, EventCategory } from "@/src/features/plant-event";
import { EVENT_CATEGORY_MAP } from "@/src/features/plant-event";
import { PlantEventHubCategorySection } from "@/src/features/plant-event/components/PlantEventHubCategorySection";

const CATEGORY_ORDER: EventCategory[] = [
  "ROUTINE_CARE",
  "HEALTH_MEDICAL",
  "GROWTH_LIFECYCLE",
];

export type EventGroupedListProps = {
  events: PlantEventResponse[];
  onPressEvent?: (eventId: string) => void;
  onToggleComplete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  eventCountLabel?: string;
};

export function EventGroupedList(props: EventGroupedListProps) {
  const {
    events: eventsProp,
    onPressEvent,
    onToggleComplete,
    onToggleTask,
    isLoading = false,
    isError = false,
    onRetry,
    emptyMessage = "Chưa có sự kiện nào được tạo ra.",
    eventCountLabel,
  } = props;

  // Always resolve to a concrete array — never undefined at runtime
  const events: PlantEventResponse[] = Array.isArray(eventsProp) ? eventsProp : [];

  if (isLoading) {
    return (
      <View className="items-center rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50">
        <ActivityIndicator size="small" color="#059669" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center rounded-2xl border border-red-100 bg-red-50 p-5 dark:bg-red-900/20">
        <Text className="text-sm font-bold text-red-600">Không tải được sự kiện.</Text>
        {onRetry ? (
          <Text className="mt-2 text-xs font-bold text-emerald-600 underline" onPress={onRetry}>
            Thử lại
          </Text>
        ) : null}
      </View>
    );
  }

  const hasEvents = events.length > 0;

  return (
    <>
      {(eventCountLabel !== undefined || hasEvents) && (
        <Text className="text-xs font-semibold text-slate-400 mb-3">
          {eventCountLabel ?? `${events.length} sự kiện`}
        </Text>
      )}

      {!hasEvents && (
        <View className="items-center rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50">
          <CalendarDays size={28} color="#cbd5e1" className="mb-2" />
          <Text className="text-sm font-medium text-slate-400">{emptyMessage}</Text>
        </View>
      )}

      {hasEvents && (
        <>
          {CATEGORY_ORDER.map((cat) => {
            // Inline grouping — no useMemo, no closure risk
            const catEvents: PlantEventResponse[] = [];
            for (let i = 0; i < events.length; i++) {
              const e = events[i];
              if (!e) continue;
              const categoryMap = EVENT_CATEGORY_MAP as Record<string, EventCategory> | undefined;
              const mappedCat = categoryMap ? (categoryMap[e.eventType] ?? "ROUTINE_CARE") : "ROUTINE_CARE";
              if (mappedCat === cat) {
                catEvents.push(e);
              }
            }
            if (catEvents.length === 0) return null;
            return (
              <PlantEventHubCategorySection
                key={cat}
                category={cat}
                events={catEvents}
                onPressEvent={onPressEvent}
                onToggleComplete={onToggleComplete}
                onToggleTask={onToggleTask}
              />
            );
          })}
        </>
      )}
    </>
  );
}
