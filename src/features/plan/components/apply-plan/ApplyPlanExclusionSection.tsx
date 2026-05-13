import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { MinusCircle, ChevronDown, LayoutGrid, Leaf, CheckCircle2 } from "lucide-react-native";
import type { FarmZoneResponse } from "@/src/features/farm";
import type { PlantResponse } from "@/src/features/plant/components/plant.types";

interface ApplyPlanExclusionSectionProps {
  showExcludeZones: boolean;
  showExcludePlants: boolean;
  zones: FarmZoneResponse[];
  plants: PlantResponse[];
  excludedFarmZoneIds: string[];
  excludedPlantIds: string[];
  onToggleExcludeZone: (id: string) => void;
  onToggleExcludePlant: (id: string) => void;
}

export function ApplyPlanExclusionSection({
  showExcludeZones,
  showExcludePlants,
  zones,
  plants,
  excludedFarmZoneIds,
  excludedPlantIds,
  onToggleExcludeZone,
  onToggleExcludePlant,
}: ApplyPlanExclusionSectionProps) {
  const { t } = useTranslation();
  const [excludeExpanded, setExcludeExpanded] = useState(false);

  const totalExcluded = excludedPlantIds.length + excludedFarmZoneIds.length;
  const showExcludeSection = showExcludeZones || showExcludePlants;

  if (!showExcludeSection) return null;

  return (
    <View className="mb-6 border border-slate-200 rounded-2xl overflow-hidden shadow-sm dark:border-slate-800 bg-white dark:bg-slate-900">
      <TouchableOpacity
        onPress={() => setExcludeExpanded(!excludeExpanded)}
        className="flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/80"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-2">
          <MinusCircle size={18} color="#f43f5e" />
          <Text className="text-base font-bold text-slate-800 dark:text-slate-200">
            {t("plan.apply.exclude", "Loại trừ mục tiêu")}
          </Text>
          {totalExcluded > 0 && (
            <View className="bg-rose-100 px-2 py-0.5 rounded-full dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50">
              <Text className="text-xs font-black text-rose-600 dark:text-rose-400">{totalExcluded}</Text>
            </View>
          )}
        </View>
        <ChevronDown 
          size={20} 
          color="#94a3b8" 
          style={{ transform: [{ rotate: excludeExpanded ? "180deg" : "0deg" }] }} 
        />
      </TouchableOpacity>

      {excludeExpanded && (
        <View className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {showExcludeZones && zones.length > 0 && (
            <View className="mb-5">
              <Text className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex-row items-center gap-1 mb-3">
                <LayoutGrid size={12} /> {t("plan.apply.excludeZones", "Bỏ qua khu vực")}
              </Text>
              <View className="gap-2.5">
                {zones.map((z) => {
                  const isExcluded = excludedFarmZoneIds.includes(z.id);
                  return isExcluded ? (
                    <TouchableOpacity
                      key={z.id}
                      onPress={() => onToggleExcludeZone(z.id)}
                      className="flex-row items-center p-3.5 border rounded-xl border-rose-300 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20"
                    >
                      <View className="w-5 h-5 rounded border flex items-center justify-center mr-3 bg-rose-500 border-rose-500">
                        <CheckCircle2 size={14} color="white" />
                      </View>
                      <Text className="text-sm font-semibold flex-1 text-rose-700 line-through dark:text-rose-400">
                        {z.zoneName}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      key={z.id}
                      onPress={() => onToggleExcludeZone(z.id)}
                      className="flex-row items-center p-3.5 border rounded-xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                    >
                      <View className="w-5 h-5 rounded border flex items-center justify-center mr-3 border-slate-300 dark:border-slate-600" />
                      <Text className="text-sm font-semibold flex-1 text-slate-700 dark:text-slate-300">
                        {z.zoneName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {showExcludePlants && plants.length > 0 && (
            <View>
              <Text className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex-row items-center gap-1 mb-3">
                <Leaf size={12} /> {t("plan.apply.excludePlants", "Bỏ qua cây")}
              </Text>
              <View className="gap-2.5">
                {plants.map((p) => {
                  const isExcluded = excludedPlantIds.includes(p.id);
                  return isExcluded ? (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => onToggleExcludePlant(p.id)}
                      className="flex-row items-center p-3.5 border rounded-xl border-rose-300 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20"
                    >
                      <View className="w-5 h-5 rounded border flex items-center justify-center mr-3 bg-rose-500 border-rose-500">
                        <CheckCircle2 size={14} color="white" />
                      </View>
                      <Text className="text-sm font-semibold flex-1 text-rose-700 line-through dark:text-rose-400">
                        {p.nickName || p.plantNumber || p.id}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => onToggleExcludePlant(p.id)}
                      className="flex-row items-center p-3.5 border rounded-xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                    >
                      <View className="w-5 h-5 rounded border flex items-center justify-center mr-3 border-slate-300 dark:border-slate-600" />
                      <Text className="text-sm font-semibold flex-1 text-slate-700 dark:text-slate-300">
                        {p.nickName || p.plantNumber || p.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
