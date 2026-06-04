import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  GitBranch,
  LayoutGrid,
  Leaf,
  MapPin,
  Pencil,
  Sprout,
  Trash2,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { PlantEventResponse } from "../../plant-event.types";
import { EntityInfoBadge } from "./EntityInfoBadge";
import { getPlantEventDisplayText } from "../../../utils/alertEventDetails";

const TARGET_TYPE_ICONS = {
  FARM: MapPin,
  FARM_ZONE: LayoutGrid,
  PLANT: Leaf,
};

interface ChildEventNodeProps {
  event: PlantEventResponse;
  dotColor: string;
  dotColorRgb: string;
  depth: number;
  onToggleComplete: (eventId: string, completed: boolean) => void;
  onEdit?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
}

export function ChildEventNode({
  event,
  dotColor,
  dotColorRgb,
  depth,
  onToggleComplete,
  onEdit,
  onDelete,
}: ChildEventNodeProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = event.children && event.children.length > 0;
  const targetIcon = event.targetType ? TARGET_TYPE_ICONS[event.targetType] : null;
  const TargetIconCmp = targetIcon ?? Sprout;
  const { title, subtitle } = getPlantEventDisplayText(event);
  const formatShortDate = (value?: string | null) => value?.slice(5) ?? null;
  const startLabel = formatShortDate(event.calculatedStartDate);
  const endLabel = formatShortDate(event.calculatedEndDate);
  const dateLabel = startLabel && endLabel && startLabel !== endLabel
    ? `${startLabel} - ${endLabel}`
    : startLabel;

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
              {title}
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

          <EntityInfoBadge event={event} />

          {subtitle ? (
            <Text
              className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400"
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}

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

        {/* Action buttons */}
        <View className="flex-row items-center gap-1">
          {onEdit && (
            <TouchableOpacity
              className="rounded-full p-1"
              onPress={() => onEdit(event)}
              activeOpacity={0.7}
            >
              <Pencil size={14} className="text-slate-400" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              className="rounded-full p-1"
              onPress={() => onDelete(event)}
              activeOpacity={0.7}
            >
              <Trash2 size={14} className="text-slate-400" />
            </TouchableOpacity>
          )}
        </View>

        {hasChildren && (
          <TouchableOpacity
            className="rounded-full bg-slate-100 p-1 dark:bg-slate-800"
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
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
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
