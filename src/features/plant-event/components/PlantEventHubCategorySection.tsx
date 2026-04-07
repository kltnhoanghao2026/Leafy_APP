import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { EventCard } from "./EventCard";
import type { EventCategory, PlantEventResponse } from "./plant-event.types";

const CATEGORY_ACCENT: Record<
  EventCategory,
  { border: string; headerBg: string; countBg: string; countText: string }
> = {
  ROUTINE_CARE: {
    border: "border-blue-200 dark:border-blue-800",
    headerBg: "bg-blue-50 dark:bg-blue-900/20",
    countBg: "bg-blue-100 dark:bg-blue-800/40",
    countText: "text-blue-600 dark:text-blue-400",
  },
  HEALTH_MEDICAL: {
    border: "border-orange-200 dark:border-orange-800",
    headerBg: "bg-orange-50 dark:bg-orange-900/20",
    countBg: "bg-orange-100 dark:bg-orange-800/40",
    countText: "text-orange-600 dark:text-orange-400",
  },
  GROWTH_LIFECYCLE: {
    border: "border-emerald-200 dark:border-emerald-800",
    headerBg: "bg-emerald-50 dark:bg-emerald-900/20",
    countBg: "bg-emerald-100 dark:bg-emerald-800/40",
    countText: "text-emerald-600 dark:text-emerald-400",
  },
};

type PlantEventHubCategorySectionProps = {
  category: EventCategory;
  events: PlantEventResponse[];
  onPressEvent?: (eventId: string) => void;
};

export function PlantEventHubCategorySection({
  category,
  events,
  onPressEvent,
}: PlantEventHubCategorySectionProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const accent = CATEGORY_ACCENT[category];

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
          <View className={`rounded-full px-1.5 py-0.5 ${accent.countBg}`}>
            <Text className={`text-[10px] font-bold ${accent.countText}`}>
              {events.length}
            </Text>
          </View>
        </View>

        {collapsed ? (
          <ChevronDown
            size={14}
            className="text-slate-400 dark:text-slate-500"
          />
        ) : (
          <ChevronUp size={14} className="text-slate-400 dark:text-slate-500" />
        )}
      </TouchableOpacity>

      {!collapsed && (
        <View className="px-2 pt-1 pb-2">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPressEvent={onPressEvent}
            />
          ))}
        </View>
      )}
    </View>
  );
}
