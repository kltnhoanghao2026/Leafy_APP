import { Text, TouchableOpacity, View } from "react-native";
import { CalendarDays, Pencil, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { formatDateShort } from "@/src/utils/date";
import type { PlantEventResponse } from "./plant-event.types";
import { getEventCategoryColors } from "./plant-event.types";

type Props = {
  event: PlantEventResponse;
  onEdit: (eventId: string) => void;
  onDelete: (event: PlantEventResponse) => void;
};

export function PlantEventCard({ event, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const colors = getEventCategoryColors(event.eventType);

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between p-4 pb-2">
        <View className="flex-1 flex-row items-center mr-3 space-x-3">
          <View
            className={`items-center justify-center rounded-xl p-2 ${colors.bg} ${colors.darkBg}`}
          >
            <CalendarDays
              size={22}
              className={`${colors.text} ${colors.darkText}`}
              strokeWidth={2.4}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold text-slate-800 dark:text-slate-100"
              numberOfLines={1}
            >
              {event.note}
            </Text>
            <Text
              className={`text-xs font-semibold ${colors.text} ${colors.darkText}`}
              numberOfLines={1}
            >
              {t(`plantEvent.eventType.${event.eventType}`)}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="items-center justify-center rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => onEdit(event.id)}
          >
            <Pencil size={16} className="text-slate-500 dark:text-slate-400" />
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center justify-center rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => onDelete(event)}
          >
            <Trash2 size={18} className="text-slate-500 dark:text-slate-400" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 pb-3">
        <View className="flex-row gap-2">
          <View
            className={`self-start rounded-lg px-2.5 py-1 ${colors.bg} ${colors.darkBg}`}
          >
            <Text
              className={`text-[11px] font-extrabold ${colors.text} ${colors.darkText}`}
            >
              {t(`plantEvent.eventType.${event.eventType}`)}
            </Text>
          </View>
          <View
            className={`self-start rounded-lg px-2.5 py-1 ${event.planned ? "bg-violet-50 dark:bg-violet-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}
          >
            <Text
              className={`text-[11px] font-extrabold ${event.planned ? "text-violet-600 dark:text-violet-400" : "text-amber-600 dark:text-amber-400"}`}
            >
              {event.planned
                ? t("plantEvent.card.planned")
                : t("plantEvent.card.immediate")}
            </Text>
          </View>
        </View>

        <View className="mt-3 gap-1.5">
          {event.description ? (
            <Text
              className="text-xs text-slate-500 dark:text-slate-400"
              numberOfLines={2}
            >
              {event.description}
            </Text>
          ) : null}
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {t("plantEvent.card.startDate")}:{" "}
            {formatDateShort(event.calculatedStartDate)}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {t("plantEvent.card.endDate")}:{" "}
            {formatDateShort(event.calculatedEndDate)}
          </Text>
          {event.durationDays != null ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              {t("plantEvent.card.duration")}: {event.durationDays}{" "}
              {t("plantEvent.card.days")}
            </Text>
          ) : null}
          {event.estimatedCost ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              {t("plantEvent.card.cost")}: {event.estimatedCost}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
