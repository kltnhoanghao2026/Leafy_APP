import React, { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Alert,
} from "react-native";
import {
  CheckCircle2,
  Circle,
  Pencil,
  Sprout,
  Trash2,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import type { PlantEventResponse } from "./plant-event.types";
import {
  getEventCategory,
  getEventTypeIcon,
} from "./plant-event.types";
import { CATEGORY_DOT_COLORS } from "./calendarConstants";
import {
  useUpdatePlantEventMutation,
  useToggleTaskMutation,
  useDeletePlantEventMutation,
  usePlantEventById,
} from "../queries";
import { useNetworkContext } from "@/src/providers/NetworkProvider";
import { useOfflinePlantEventById } from "@/src/features/offline/hooks/useOfflineQueries";
import { CircleProgress, ProgressRow, ChildEventNode } from "./subComponents/progress";
import { hexToRgb } from "../utils/colors";

// ── Main Modal ────────────────────────────────────────────────────────────────

export interface PlantEventProgressModalProps {
  event: PlantEventResponse;
  visible: boolean;
  onClose: () => void;
  onEdit?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
}

export function PlantEventProgressModal({
  event: initialEvent,
  visible,
  onClose,
  onEdit,
  onDelete,
}: PlantEventProgressModalProps) {
  const [event, setEvent] = useState(initialEvent);

  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);

  const { t } = useTranslation();
  const { height: viewportHeight } = useWindowDimensions();

  const { isOffline } = useNetworkContext();

  // Live data refetch — re-fetch every 10s while modal is open to keep progress current
  const { data: liveEventOnline } = usePlantEventById(
    initialEvent.id,
    visible && !isOffline ? 10_000 : undefined,
  );
  const { data: liveEventOffline } = useOfflinePlantEventById(
    visible && isOffline ? initialEvent.id : "",
  );

  const updateEventMutation = useUpdatePlantEventMutation();
  const toggleTaskMutation = useToggleTaskMutation();
  const deleteEventMutation = useDeletePlantEventMutation();

  // Use live event data for display; fall back to local state for optimistic updates
  const displayEvent = (isOffline ? liveEventOffline : liveEventOnline) ?? event;

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

  const handleDelete = (eventToDelete: PlantEventResponse) => {
    Alert.alert(
      t("plantEvent.detail.deleteConfirmTitle"),
      t("plantEvent.detail.deleteConfirmMessage", { note: eventToDelete.note ?? eventToDelete.eventType }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("plantEvent.detail.delete"),
          style: "destructive",
          onPress: () => {
            deleteEventMutation.mutate(eventToDelete.id, {
              onSuccess: () => {
                onClose();
              },
            });
          },
        },
      ],
    );
  };

  // Event info
  const category = getEventCategory(displayEvent.eventType);
  const dotColor = CATEGORY_DOT_COLORS[category] ?? "#94a3b8";
  const dotColorRgb = hexToRgb(dotColor);
  const Icon = getEventTypeIcon(displayEvent.eventType) ?? Sprout;

  const tasks = displayEvent.tasks ?? [];
  const taskDone = tasks.filter((t) => t.completed).length;
  const taskPct = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 100) : 0;

  const hasChildren = displayEvent.children && displayEvent.children.length > 0;
  const childrenDone = hasChildren ? displayEvent.children.filter((c) => c.completed).length : 0;
  const childrenPct = hasChildren ? Math.round((childrenDone / displayEvent.children.length) * 100) : 0;

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
                    {displayEvent.note}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2 flex-wrap">
                    <View
                      className="rounded-lg px-2 py-0.5"
                      style={{ backgroundColor: `rgba(${dotColorRgb},0.15)` }}
                    >
                      <Text className="text-[11px] font-bold" style={{ color: dotColor }}>
                    {t(`plantEvent.eventType.${displayEvent.eventType}`)}
                  </Text>
                </View>
                    {displayEvent.targetType && (
                      <View className="flex-row items-center gap-1">
                        <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {t(`plantEvent.targetType.${displayEvent.targetType}`)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                {onEdit && (
                  <TouchableOpacity
                    onPress={() => onEdit(displayEvent)}
                    className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
                    activeOpacity={0.7}
                  >
                    <Pencil size={16} className="text-slate-500 dark:text-slate-400" />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity
                    onPress={() => handleDelete(event)}
                    className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} className="text-slate-500 dark:text-slate-400" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={onClose}
                  className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
                  activeOpacity={0.7}
                >
                  <X size={20} className="text-slate-500 dark:text-slate-400" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} style={{ flexShrink: 1 }}>
              {/* Progress Summary Row */}
              <View className="mb-6 flex-row gap-3">
                {tasks.length > 0 && (
                  <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <CircleProgress pct={taskPct} size={56} strokeWidth={6} color={dotColor} />
                    <View className="flex-1 ml-3">
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
                  </View>
                )}

                {hasChildren && (
                  <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <CircleProgress pct={childrenPct} size={56} strokeWidth={6} color={dotColor} />
                    <View className="flex-1 ml-3">
                      <Text className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                        {t("plantEvent.progress.targetProgress")}
                      </Text>
                      <Text className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">
                        {childrenPct}%
                      </Text>
                      <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {childrenDone} / {displayEvent.children.length} {t("plantEvent.card.completed")}
                      </Text>
                    </View>
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
                    {t("plantEvent.progress.progressDetails", { count: displayEvent.children.length })}
                  </Text>
                  <View className="rounded-2xl border border-slate-100 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                    {displayEvent.children.map((child) => (
                      <ChildEventNode
                        key={child.id}
                        event={child}
                        dotColor={dotColor}
                        dotColorRgb={dotColorRgb}
                        depth={0}
                        onToggleComplete={handleToggleComplete}
                        onEdit={onEdit}
                        onDelete={handleDelete}
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
