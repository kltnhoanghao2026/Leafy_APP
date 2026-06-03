import React from "react";
import { View, Text } from "react-native";
import { Leaf, LayoutGrid, MapPin } from "lucide-react-native";
import type { PlantEventResponse } from "../../plant-event.types";

interface EntityInfoBadgeProps {
  event: PlantEventResponse;
}

export function EntityInfoBadge({ event }: EntityInfoBadgeProps) {
  if (event.plant) {
    return (
      <View className="mt-1 flex-row items-center gap-1.5">
        <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 dark:bg-emerald-900/30">
          <Leaf size={10} className="text-emerald-600 dark:text-emerald-400" />
          <Text className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            {event.plant.nickName || event.plant.plantNumber}
          </Text>
        </View>
        {event.plant.tagCode && (
          <Text className="text-[9px] text-slate-400 dark:text-slate-500">
            #{event.plant.tagCode}
          </Text>
        )}
      </View>
    );
  }

  if (event.farmZone) {
    return (
      <View className="mt-1 flex-row items-center gap-1.5">
        <View className="flex-row items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 dark:bg-violet-900/30">
          <LayoutGrid size={10} className="text-violet-600 dark:text-violet-400" />
          <Text className="text-[10px] font-semibold text-violet-700 dark:text-violet-300">
            {event.farmZone.zoneName}
          </Text>
        </View>
        {event.farmZone.zoneCode && (
          <Text className="text-[9px] text-slate-400 dark:text-slate-500">
            {event.farmZone.zoneCode}
          </Text>
        )}
      </View>
    );
  }

  if (event.farmPlot) {
    return (
      <View className="mt-1 flex-row items-center gap-1.5">
        <View className="flex-row items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 dark:bg-amber-900/30">
          <MapPin size={10} className="text-amber-600 dark:text-amber-400" />
          <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            {event.farmPlot.name}
          </Text>
        </View>
        {event.farmPlot.code && (
          <Text className="text-[9px] text-slate-400 dark:text-slate-500">
            {event.farmPlot.code}
          </Text>
        )}
      </View>
    );
  }

  return null;
}
