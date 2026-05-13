import React, { useMemo, useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  LayoutGrid,
  Leaf,
  ListChecks,
  MapPin,
  X,
  Sprout,
  GitBranch,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import type { PlantEventResponse } from "./plant-event.types";
import {
  getEventCategoryColors,
  getEventCategory,
  getEventTypeIcon,
} from "./plant-event.types";
import { CATEGORY_DOT_COLORS } from "./calendarConstants";
import { useUpdatePlantEventMutation, useToggleTaskMutation } from "../queries";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import Colors from "@/src/constants/Colors";

const TARGET_TYPE_ICONS = {
  FARM: MapPin,
  FARM_ZONE: LayoutGrid,
  PLANT: Leaf,
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0,0,0";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

// ── ChildEventTree ────────────────────────────────────────────────────────────

function ChildEventNode({
  event,
  dotColor,
  dotColorRgb,
  depth,
  onToggleComplete,
}: {
  event: PlantEventResponse;
  dotColor: string;
  dotColorRgb: string;
  depth: number;
  onToggleComplete: (eventId: string, completed: boolean) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = event.children && event.children.length > 0;
  const targetIcon = event.targetType ? TARGET_TYPE_ICONS[event.targetType] : null;
  const TargetIconCmp = targetIcon ?? Sprout;
  
  // Date formatting
  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    const [y, m, day] = d.split('-');
    return `${day}/${m}`;
  };
  const startStr = fmtDate(event.calculatedStartDate);
  const endStr = fmtDate(event.calculatedEndDate);
  const dateLabel = startStr && endStr && startStr !== endStr ? `${startStr} → ${endStr}` : startStr;

  return (
    <View className="mb-2">
      <View className="flex-row items-start gap-3 rounded-xl px-2 py-2.5">
        <TouchableOpacity
          className="mt-1"
          onPress={() => onToggleComplete(event.id, !event.completed)}
          activeOpacity={0.7}
        >
          {event.completed ? (
            <CheckCircle2 size={20} color="#10b981" />
          ) : (
            <Circle size={20} className="text-slate-300 dark:text-slate-600" />
          )}
        </TouchableOpacity>

        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text
              className={`text-sm font-bold ${
                event.completed ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-800 dark:text-slate-100"
              }`}
            >
              {event.note}
            </Text>
            {dateLabel && (
              <View className="flex-row items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                <Clock size={10} className="text-slate-500 dark:text-slate-400" />
                <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {dateLabel}
                </Text>
              </View>
            )}
          </View>

          <View className="mt-1 flex-row items-center gap-2 flex-wrap">
            {event.targetType && (
              <View className="flex-row items-center gap-1">
                <TargetIconCmp size={12} className="text-slate-400 dark:text-slate-500" />
                <Text className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  {t(`plantEvent.targetType.${event.targetType}`)}
                </Text>
              </View>
            )}
            {hasChildren && (
              <View className="flex-row items-center gap-1 rounded-full px-1.5 py-0.5" style={{ backgroundColor: `rgba(${dotColorRgb},0.15)` }}>
                <GitBranch size={10} color={dotColor} />
                <Text className="text-[10px] font-bold" style={{ color: dotColor }}>
                  {event.children.filter((c) => c.completed).length}/{event.children.length}
                </Text>
              </View>
            )}
          </View>
        </View>

        {hasChildren && (
          <TouchableOpacity
            className="rounded-full bg-slate-100 p-1 dark:bg-slate-800"
            onPress={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown size={14} className="text-slate-500" />
            ) : (
              <ChevronRight size={14} className="text-slate-500" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {expanded && hasChildren && (
        <View className="mt-1 flex-row">
          <View className="ml-4 w-[2px] bg-slate-100 dark:bg-slate-800" />
          <View className="flex-1 pl-3">
            {event.children.map((child) => (
              <ChildEventNode
                key={child.id}
                event={child}
                dotColor={dotColor}
                dotColorRgb={dotColorRgb}
                depth={depth + 1}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export interface PlantEventProgressModalProps {
  event: PlantEventResponse;
  visible: boolean;
  onClose: () => void;
}

export function PlantEventProgressModal({
  event: initialEvent,
  visible,
  onClose,
}: PlantEventProgressModalProps) {
  const [event, setEvent] = useState(initialEvent);

  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);
  const { t } = useTranslation();
  const { height: viewportHeight } = useWindowDimensions();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  const updateEventMutation = useUpdatePlantEventMutation();
  const toggleTaskMutation = useToggleTaskMutation();

  const handleToggleComplete = (eventId: string, completed: boolean) => {
    const mutationsToFire: { id: string; completed: boolean }[] = [];

    const markAllChildren = (
      node: PlantEventResponse,
      comp: boolean
    ): PlantEventResponse => {
      if (node.completed !== comp) {
        mutationsToFire.push({ id: node.id, completed: comp });
      }
      if (!node.children || node.children.length === 0) {
        return { ...node, completed: comp };
      }
      return {
        ...node,
        completed: comp,
        children: node.children.map((child) => markAllChildren(child, comp)),
      };
    };

    const updateEventTree = (
      node: PlantEventResponse,
      targetId: string,
      targetComp: boolean
    ): PlantEventResponse => {
      if (node.id === targetId) {
        return markAllChildren(node, targetComp);
      }
      if (node.children && node.children.length > 0) {
        const updatedChildren = node.children.map((child) =>
          updateEventTree(child, targetId, targetComp)
        );
        const allChildrenComplete = updatedChildren.every((c) => c.completed);
        
        if (node.completed !== allChildrenComplete) {
          mutationsToFire.push({ id: node.id, completed: allChildrenComplete });
        }

        return {
          ...node,
          children: updatedChildren,
          completed: allChildrenComplete,
        };
      }
      return node;
    };

    setEvent((prev) => {
      const nextEvent = updateEventTree(prev, eventId, completed);
      mutationsToFire.forEach((m) => {
        updateEventMutation.mutate({ eventId: m.id, body: { completed: m.completed } });
      });
      return nextEvent;
    });
  };

  const handleToggleTask = (taskIndex: number) => {
    setEvent((prev) => {
      const newTasks = [...(prev.tasks || [])];
      if (newTasks[taskIndex]) {
        newTasks[taskIndex] = {
          ...newTasks[taskIndex],
          completed: !newTasks[taskIndex].completed,
        };
      }
      return { ...prev, tasks: newTasks };
    });
    toggleTaskMutation.mutate({ eventId: event.id, taskIndex });
  };

  // Event info
  const category = getEventCategory(event.eventType);
  // Re-use FE logic for dot colors, but adapted to mobile context where getEventCategoryColors is different.
  // Actually we can just use the map from calendarConstants
  const dotColor = CATEGORY_DOT_COLORS[category] ?? "#94a3b8";
  const dotColorRgb = hexToRgb(dotColor);
  const Icon = getEventTypeIcon(event.eventType) ?? Sprout;

  const tasks = event.tasks ?? [];
  const taskDone = tasks.filter((t) => t.completed).length;
  const taskPct = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 100) : 0;

  const hasChildren = event.children && event.children.length > 0;
  const childrenDone = hasChildren ? event.children.filter((c) => c.completed).length : 0;
  const childrenPct = hasChildren ? Math.round((childrenDone / event.children.length) * 100) : 0;

  const fmtDate = (d?: string | null) => d ? format(new Date(d), "dd/MM/yyyy") : "—";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        {/* Background Overlay */}
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
          onPress={onClose}
        />
        
        {/* Modal Content */}
        <View
          className="rounded-t-3xl bg-white px-4 pt-2 pb-8 dark:bg-slate-900"
          style={{
            maxHeight: viewportHeight * 0.9,
            minHeight: viewportHeight * 0.5,
          }}
        >
            <View className="mb-4 items-center">
              <View className="h-1 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
            </View>

            <View className="mb-4 flex-row items-start justify-between">
              <View className="flex-1 flex-row items-center gap-3">
                <View
                  className="items-center justify-center rounded-xl p-3"
                  style={{ backgroundColor: `rgba(${dotColorRgb},0.15)` }}
                >
                  <Icon size={24} color={dotColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {event.note}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2 flex-wrap">
                    <View
                      className="rounded-lg px-2 py-0.5"
                      style={{ backgroundColor: `rgba(${dotColorRgb},0.15)` }}
                    >
                      <Text className="text-[11px] font-bold" style={{ color: dotColor }}>
                        {t(`plantEvent.eventType.${event.eventType}`)}
                      </Text>
                    </View>
                    {event.targetType && (
                      <View className="flex-row items-center gap-1">
                        <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {t(`plantEvent.targetType.${event.targetType}`)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
              >
                <X size={20} className="text-slate-500 dark:text-slate-400" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} style={{ flexShrink: 1 }}>
              {/* Progress Summary Row */}
              <View className="mb-6 flex-row gap-3">
                {tasks.length > 0 && (
                  <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <View>
                      <Text className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                        {t("plantEvent.card.tasksTitle")}
                      </Text>
                      <Text className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">
                        {taskPct}%
                      </Text>
                      <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {taskDone} / {tasks.length} {t("plantEvent.card.completed")}
                      </Text>
                    </View>
                    <ListChecks size={28} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                  </View>
                )}

                {hasChildren && (
                  <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <View>
                      <Text className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                        {t("plantEvent.progress.targetProgress")}
                      </Text>
                      <Text className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">
                        {childrenPct}%
                      </Text>
                      <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {childrenDone} / {event.children.length} {t("plantEvent.card.completed")}
                      </Text>
                    </View>
                    <GitBranch size={28} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                  </View>
                )}
              </View>

              {/* Tasks */}
              {tasks.length > 0 && (
                <View className="mb-6">
                  <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {t("plantEvent.card.tasksTitle")}
                  </Text>
                  <View className="gap-2">
                    {tasks.map((task, idx) => (
                      <TouchableOpacity
                        key={idx}
                        className={`flex-row items-center gap-3 rounded-2xl border p-3 ${
                          task.completed
                            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/10"
                            : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                        }`}
                        onPress={() => handleToggleTask(idx)}
                        activeOpacity={0.7}
                      >
                        {task.completed ? (
                          <CheckCircle2 size={22} color="#10b981" />
                        ) : (
                          <Circle size={22} className="text-slate-300 dark:text-slate-600" />
                        )}
                        <View className="flex-1">
                          <Text
                            className={`text-sm font-semibold ${
                              task.completed ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {task.title}
                          </Text>
                          {task.description && (
                            <Text className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500" numberOfLines={1}>
                              {task.description}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Child Event Tree */}
              {hasChildren && (
                <View className="mb-6">
                  <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {t("plantEvent.progress.progressDetails", { count: event.children.length })}
                  </Text>
                  <View className="rounded-2xl border border-slate-100 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                    {event.children.map((child) => (
                      <ChildEventNode
                        key={child.id}
                        event={child}
                        dotColor={dotColor}
                        dotColorRgb={dotColorRgb}
                        depth={0}
                        onToggleComplete={handleToggleComplete}
                      />
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
