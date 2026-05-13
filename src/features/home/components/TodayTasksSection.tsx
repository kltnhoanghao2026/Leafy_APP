import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CalendarDays } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { usePlantEventsCalendar } from "../../plant-event/queries";
import { useUpdatePlantEventMutation, useToggleTaskMutation } from "../../plant-event/queries";
import { PlantEventHubCategorySection } from "../../plant-event/components/PlantEventHubCategorySection";
import type { PlantEventResponse, EventCategory } from "../../plant-event/components/plant-event.types";
import { EVENT_CATEGORY_MAP } from "../../plant-event/components/plant-event.types";
import { homeStyles as styles } from "./home.styles";

type TodayTasksSectionProps = {
  cardBg: string;
  cardBorder: string;
  textColor: string;
};

export function TodayTasksSection({
  cardBg,
  cardBorder,
  textColor,
}: TodayTasksSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const { data: events = [], isLoading } = usePlantEventsCalendar({
    startDate: todayStr,
    endDate: todayStr,
  });

  const updateEventMutation = useUpdatePlantEventMutation();
  const toggleTaskMutation = useToggleTaskMutation();

  const handleToggleComplete = (event: PlantEventResponse) => {
    updateEventMutation.mutate({
      eventId: event.id,
      body: { completed: !event.completed },
    });
  };

  const handleToggleTask = (event: PlantEventResponse, taskIndex: number) => {
    toggleTaskMutation.mutate({ eventId: event.id, taskIndex });
  };

  const handleNavigateToEvent = (eventId: string) => {
    router.push(`/(main)/plant-events/${eventId}`);
  };

  const renderGroupedEvents = (evts: PlantEventResponse[]) => {
    const grouped: Record<EventCategory, PlantEventResponse[]> = {
      ROUTINE_CARE: [],
      HEALTH_MEDICAL: [],
      GROWTH_LIFECYCLE: [],
    };
    for (const evt of evts) {
      const cat = EVENT_CATEGORY_MAP[evt.eventType] ?? "ROUTINE_CARE";
      grouped[cat].push(evt);
    }
    
    const CATEGORY_ORDER: EventCategory[] = [
      "ROUTINE_CARE",
      "HEALTH_MEDICAL",
      "GROWTH_LIFECYCLE",
    ];

    return (
      <>
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
      </>
    );
  };

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t("plantManagement.overview.todayTasksTitle", "Today's Tasks")}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(main)/plant-events/calendar")}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#2F7F34" }}>
            {t("plantManagement.overview.viewAll", "View Calendar")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, borderRadius: 16, padding: 12, minHeight: 120 }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color="#2F7F34" />
          </View>
        ) : events.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 20 }}>
            <CalendarDays size={32} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "500", textAlign: "center" }}>
              {t("plantManagement.overview.todayTasksEmpty", "No tasks scheduled for today")}
            </Text>
          </View>
        ) : (
          renderGroupedEvents(events)
        )}
      </View>
    </View>
  );
}
