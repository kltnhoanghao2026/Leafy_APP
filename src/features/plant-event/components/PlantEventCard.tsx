import { Text, TouchableOpacity, View } from "react-native";
import {
  CalendarDays,
  FileText,
  Leaf,
  MapPin,
  Paperclip,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { formatDateShort } from "@/src/utils/date";
import type { PlantEventResponse } from "./plant-event.types";
import { getEventCategoryColors, getEventCategory } from "./plant-event.types";
import { CATEGORY_DOT_COLORS } from "./calendarConstants";
import { getPlantEventDisplayText } from "../utils/alertEventDetails";

type Props = {
  event: PlantEventResponse;
  onEdit: (eventId: string) => void;
  onDelete: (event: PlantEventResponse) => void;
};

function EntityInfoRow({
  icon: Icon,
  text,
  className,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  text?: string | null;
  className?: string;
}) {
  if (!text) return null;
  return (
    <View className="flex-row items-center gap-1">
      <Icon size={11} className={className} />
      <Text
        className={`text-[11px] font-medium ${className}`}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

export function PlantEventCard({ event, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const colors = getEventCategoryColors(event.eventType);
  const category = getEventCategory(event.eventType);
  const dotColor = CATEGORY_DOT_COLORS[category] ?? "#94a3b8";
  const { title, subtitle } = getPlantEventDisplayText(event);

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between p-4 pb-2">
        <View className="flex-1 flex-row items-center mr-3 space-x-3">
          <View
            className={`items-center justify-center rounded-xl p-2 ${colors.bg} ${colors.darkBg}`}
          >
            <CalendarDays
              size={22}
              color={dotColor}
              strokeWidth={2.4}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold text-slate-800 dark:text-slate-100"
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                className="text-[11px] text-slate-500 dark:text-slate-400"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
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
          {event.completed ? (
            <View className="self-start rounded-lg bg-emerald-50 px-2.5 py-1 dark:bg-emerald-900/20">
              <Text className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                {t("plantEvent.card.completed")}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Entity summary info (plant / farm / plan apply) ── */}
        {(event.plant || event.farmPlot || event.farmZone || event.planApply) ? (
          <View className="mt-2.5 flex-row flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-2.5 dark:border-slate-800">
            {event.plant ? (
              <EntityInfoRow
                icon={Leaf}
                text={event.plant.nickName || event.plant.plantNumber}
                className="text-emerald-600 dark:text-emerald-400"
              />
            ) : null}
            {event.farmPlot ? (
              <EntityInfoRow
                icon={MapPin}
                text={event.farmPlot.name}
                className="text-sky-600 dark:text-sky-400"
              />
            ) : null}
            {event.farmZone ? (
              <EntityInfoRow
                icon={MapPin}
                text={event.farmZone.zoneName}
                className="text-amber-600 dark:text-amber-400"
              />
            ) : null}
            {event.planApply ? (
              <EntityInfoRow
                icon={FileText}
                text={event.planApply.planName}
                className="text-violet-600 dark:text-violet-400"
              />
            ) : null}
            {event.attachmentIds?.length ? (
              <EntityInfoRow
                icon={Paperclip}
                text={`${event.attachmentIds.length}`}
                className="text-slate-500 dark:text-slate-400"
              />
            ) : null}
          </View>
        ) : null}

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
