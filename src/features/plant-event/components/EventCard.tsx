import { useState } from "react";
import {
  LayoutAnimation,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ListChecks,
  MapPin,
  Leaf,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import type { PlantEventResponse } from "./plant-event.types";
import { getEventCategoryColors, getEventTypeIcon } from "./plant-event.types";
import { useColorScheme } from "@/src/hooks/useColorScheme";

// ── Accent dot color map (matching category section) ─────────────────────
const CATEGORY_DOT_COLORS: Record<string, string> = {
  ROUTINE_CARE: "#3B82F6",
  HEALTH_MEDICAL: "#F97316",
  GROWTH_LIFECYCLE: "#10B981",
};

import { EVENT_CATEGORY_MAP } from "./plant-event.types";

type EventCardProps = {
  event: PlantEventResponse;
  onPressEvent?: (eventId: string) => void;
  onToggleComplete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  readonly?: boolean;
};

export function EventCard({
  event,
  onPressEvent,
  onToggleComplete,
  onToggleTask,
  readonly,
}: EventCardProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? "light";
  const colors = getEventCategoryColors(event.eventType);
  const Icon = getEventTypeIcon(event.eventType);
  const [expanded, setExpanded] = useState(false);
  const category = EVENT_CATEGORY_MAP[event.eventType] ?? "ROUTINE_CARE";
  const dotColor = CATEGORY_DOT_COLORS[category] ?? "#3B82F6";

  const hasDetails =
    !!event.description ||
    event.calculatedEndDate != null ||
    event.durationDays != null ||
    event.phiDays != null ||
    event.ppeRequired != null ||
    event.mrlNote != null ||
    event.estimatedCost != null ||
    (event.tasks != null && event.tasks.length > 0);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  // ── Progress computations ──────────────────────────────────────────────
  const tasks = event.tasks ?? [];
  const hasTasks = tasks.length > 0;
  const tasksDone = hasTasks ? tasks.filter((t) => t.completed).length : 0;
  const tasksAllDone = hasTasks && tasksDone === tasks.length;
  const taskPct = hasTasks ? Math.round((tasksDone / tasks.length) * 100) : 0;

  const directChildren = event.children ?? [];
  const hasChildren = directChildren.length > 0;
  const hasLegacyProgress =
    event.trackingGranularity != null &&
    event.trackingGranularity !== "NONE" &&
    event.progressTotal != null &&
    event.progressTotal > 0;
  const hasBroadProgress = hasChildren || hasLegacyProgress;

  const broadTotal = hasChildren
    ? directChildren.length
    : (event.progressTotal ?? 0);
  const broadDone = hasChildren
    ? directChildren.filter((c) => c.completed).length
    : (event.progressCompleted ?? 0);
  const broadAllDone = hasBroadProgress && broadDone === broadTotal;
  const broadPct =
    hasBroadProgress && broadTotal > 0
      ? Math.round((broadDone / broadTotal) * 100)
      : 0;

  const isZone = hasChildren
    ? event.targetType === "FARM"
    : event.trackingGranularity === "ZONE";

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
          {/* Complete toggle */}
          {onToggleComplete && !readonly && (
            <TouchableOpacity
              onPress={() => onToggleComplete(event)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
              className="mr-2"
            >
              {event.completed ? (
                <CheckCircle2
                  size={20}
                  color="#10B981"
                />
              ) : (
                <Circle
                  size={20}
                  color={scheme === "dark" ? "#475569" : "#cbd5e1"}
                />
              )}
            </TouchableOpacity>
          )}

          {/* Icon */}
          <View
            className={`items-center justify-center rounded-lg p-2 ${colors.bg} ${colors.darkBg}`}
          >
            <Icon size={18} color={scheme === "dark" ? undefined : undefined} />
          </View>

          {/* Content */}
          <View className="ml-3 flex-1">
            <Text
              className={`text-sm font-bold ${
                event.completed
                  ? "text-slate-400 dark:text-slate-600 line-through"
                  : "text-slate-800 dark:text-slate-100"
              }`}
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

            {/* ── Task progress bar ───────────────────────────────── */}
            {hasTasks && !readonly && (
              <View className="mt-1.5 flex-row items-center gap-1.5">
                <ListChecks
                  size={12}
                  color={tasksAllDone ? "#10B981" : dotColor}
                />
                <View className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <View
                    style={{
                      width: `${taskPct}%`,
                      backgroundColor: tasksAllDone ? "#10B981" : dotColor,
                    }}
                    className="h-1 rounded-full"
                  />
                </View>
                <Text
                  style={{ color: tasksAllDone ? "#10B981" : dotColor }}
                  className="text-[10px] font-black"
                >
                  {tasksDone}/{tasks.length}
                </Text>
              </View>
            )}

            {/* ── Broad-scope progress bar (children / tracking) ──── */}
            {hasBroadProgress && !readonly && (
              <View className="mt-1 flex-row items-center gap-1.5">
                {isZone ? (
                  <MapPin
                    size={12}
                    color={broadAllDone ? "#10B981" : dotColor}
                  />
                ) : (
                  <Leaf
                    size={12}
                    color={broadAllDone ? "#10B981" : dotColor}
                  />
                )}
                <View className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <View
                    style={{
                      width: `${broadPct}%`,
                      backgroundColor: broadAllDone ? "#10B981" : dotColor,
                    }}
                    className="h-1 rounded-full"
                  />
                </View>
                <Text
                  style={{ color: broadAllDone ? "#10B981" : dotColor }}
                  className="text-[10px] font-black"
                >
                  {broadDone}/{broadTotal}{" "}
                  {isZone
                    ? t("plantEvent.card.zones", { defaultValue: "vùng" })
                    : t("plantEvent.card.plants", { defaultValue: "cây" })}
                </Text>
              </View>
            )}
          </View>

          {/* Right side: date + planned badge + expand toggle */}
          <View className="items-end gap-1 ml-2">
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
                    color={scheme === "dark" ? "#64748b" : "#94a3b8"}
                  />
                ) : (
                  <ChevronDown
                    size={14}
                    color={scheme === "dark" ? "#64748b" : "#94a3b8"}
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

          {/* ── Task checklist (expanded) ────────────────────────── */}
          {hasTasks && (
            <View className="mt-2">
              <Text className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">
                {t("plantEvent.card.tasks", { defaultValue: "Công việc" })}
              </Text>
              {tasks.map((task, idx) => (
                <View
                  key={idx}
                  className="flex-row items-start gap-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-2 mb-1"
                >
                  {readonly ? (
                    <View className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                  ) : (
                    <TouchableOpacity
                      onPress={() => onToggleTask?.(event, idx)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      activeOpacity={0.6}
                      className="mt-0.5"
                    >
                      {task.completed ? (
                        <CheckCircle2 size={16} color="#10B981" />
                      ) : (
                        <Circle
                          size={16}
                          color={scheme === "dark" ? "#475569" : "#cbd5e1"}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  <View className="flex-1">
                    <Text
                      className={`text-xs font-medium ${
                        task.completed
                          ? "text-slate-400 dark:text-slate-600 line-through"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                        {task.description}
                      </Text>
                    )}
                  </View>
                  {task.estimatedCost && (
                    <View
                      className={`rounded-full px-1.5 py-0.5 ${colors.bg} ${colors.darkBg}`}
                    >
                      <Text
                        className={`text-[9px] font-bold ${colors.text} ${colors.darkText}`}
                      >
                        {task.estimatedCost}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
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
