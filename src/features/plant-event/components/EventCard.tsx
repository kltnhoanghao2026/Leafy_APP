import { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import type { PlantEventResponse } from "./plant-event.types";
import { getEventCategoryColors, getEventTypeIcon } from "./plant-event.types";



type EventCardProps = {
  event: PlantEventResponse;
  onPressEvent?: (eventId: string) => void;
};

export function EventCard({ event, onPressEvent }: EventCardProps) {
  const { t } = useTranslation();
  const colors = getEventCategoryColors(event.eventType);
  const Icon = getEventTypeIcon(event.eventType);
  const [expanded, setExpanded] = useState(false);

  const hasDetails =
    !!event.description ||
    event.calculatedEndDate != null ||
    event.durationDays != null ||
    event.phiDays != null ||
    event.ppeRequired != null ||
    event.mrlNote != null ||
    event.estimatedCost != null;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View className="mb-2 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      {/* ── Main row ─────────────────────────────────────────────── */}
      <TouchableOpacity
        className="flex-row items-center"
        onPress={() => onPressEvent?.(event.id)}
        disabled={!onPressEvent}
        activeOpacity={onPressEvent ? 0.7 : 1}
      >
        {/* Category color strip */}
        <View
          className={`w-1.5 self-stretch min-h-[64px] ${colors.bg} ${colors.darkBg}`}
        />

        <View className="flex-1 flex-row items-center px-3 py-3">
          {/* Icon */}
          <View
            className={`items-center justify-center rounded-lg p-2 ${colors.bg} ${colors.darkBg}`}
          >
            <Icon size={18} className={`${colors.text} ${colors.darkText}`} />
          </View>

          {/* Content */}
          <View className="ml-3 flex-1">
            <Text
              className="text-sm font-bold text-slate-800 dark:text-slate-100"
              numberOfLines={1}
            >
              {event.note}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-2">
              <Text
                className={`text-[11px] font-semibold ${colors.text} ${colors.darkText}`}
              >
                {t(`plantEvent.eventType.${event.eventType}`)}
              </Text>
              {event.durationDays != null && (
                <Text className="text-[10px] text-slate-400 dark:text-slate-500">
                  {event.durationDays} {t("plantEvent.card.days")}
                </Text>
              )}
            </View>
          </View>

          {/* Right side: date + planned badge + expand toggle */}
          <View className="items-end gap-1">
            <Text className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {event.calculatedStartDate?.slice(5) ?? "—"}
            </Text>
            {event.planned && (
              <View className="rounded bg-violet-50 px-1.5 py-0.5 dark:bg-violet-900/20">
                <Text className="text-[9px] font-bold text-violet-600 dark:text-violet-400">
                  {t("plantEvent.card.planned")}
                </Text>
              </View>
            )}
            {hasDetails && (
              <TouchableOpacity
                onPress={toggleExpand}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.6}
              >
                {expanded ? (
                  <ChevronUp
                    size={14}
                    className="text-slate-400 dark:text-slate-500"
                  />
                ) : (
                  <ChevronDown
                    size={14}
                    className="text-slate-400 dark:text-slate-500"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Expanded details ─────────────────────────────────────── */}
      {expanded && hasDetails && (
        <View className="mx-3 mb-3 mt-0 border-t border-slate-100 pt-2 dark:border-slate-800">
          {event.description ? (
            <View className="mb-2">
              <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("plantEvent.card.description")}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                {event.description}
              </Text>
            </View>
          ) : null}

          <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
            {event.calculatedEndDate && (
              <View>
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {t("plantEvent.card.endDate")}
                </Text>
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {event.calculatedEndDate.slice(5)}
                </Text>
              </View>
            )}
            {event.durationDays != null && (
              <View>
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {t("plantEvent.card.duration")}
                </Text>
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {event.durationDays} {t("plantEvent.card.days")}
                </Text>
              </View>
            )}
            {event.phiDays != null && (
              <View>
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {t("plantEvent.card.phi")}
                </Text>
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {event.phiDays} {t("plantEvent.card.days")}
                </Text>
              </View>
            )}
            {event.estimatedCost != null && (
              <View>
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {t("plantEvent.card.cost")}
                </Text>
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {event.estimatedCost}
                </Text>
              </View>
            )}
          </View>

          {event.ppeRequired && (
            <View className="mt-1.5">
              <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("plantEvent.card.ppe")}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                {event.ppeRequired}
              </Text>
            </View>
          )}

          {event.mrlNote && (
            <View className="mt-1.5">
              <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("plantEvent.card.mrl")}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                {event.mrlNote}
              </Text>
            </View>
          )}

          {onPressEvent && (
            <TouchableOpacity
              className="mt-2 self-start"
              onPress={() => onPressEvent(event.id)}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-semibold ${colors.text} ${colors.darkText}`}
              >
                {t("plantEvent.card.viewDetails")} →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
