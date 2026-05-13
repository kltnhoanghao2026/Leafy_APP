import { Text, TouchableOpacity, View } from "react-native";
import { Check, Leaf, Pencil, Trash2, Sprout, MapPin, CalendarDays, Hash } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { formatDate } from "@/src/utils/date";
import type { PlantResponse } from "./plant.types";

type Props = {
  plant: PlantResponse;
  speciesName?: string;
  farmPlotName?: string;
  onEdit: (plantId: string) => void;
  onDelete: (plant: PlantResponse) => void;
  selected?: boolean;
  onToggleSelect?: (plantId: string) => void;
  selectionMode?: boolean;
  viewMode?: "list" | "grid";
};

export function PlantCard({
  plant,
  speciesName,
  farmPlotName,
  onEdit,
  onDelete,
  selected = false,
  onToggleSelect,
  selectionMode = false,
  viewMode = "list",
}: Props) {
  const { t } = useTranslation();

  const handlePress = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(plant.id);
    }
  };

  const handleLongPress = () => {
    if (onToggleSelect) {
      onToggleSelect(plant.id);
    }
  };

  const actualFarmPlotName = farmPlotName || plant.farmPlotId;

  if (viewMode === "grid") {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        className={`mb-4 overflow-hidden rounded-3xl border p-4 shadow-sm ${
          selected
            ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/20"
            : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        }`}
      >
        {/* Header: Plant Number & Status */}
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1 mr-2">
            <Text
              className="mb-1 text-lg font-black text-slate-800 dark:text-slate-100"
              numberOfLines={1}
            >
              {plant.plantNumber}
            </Text>
            <Text
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400"
              numberOfLines={1}
            >
              {plant.nickName?.trim() || t("plant.card.noNickname", "Không có tên")}
            </Text>
          </View>
          <View className="flex-shrink-0">
            <StatusBadge label={plant.plantStatus} variant="success" />
          </View>
        </View>

        {/* Selected Overlay Checkmark vs Leaf Icon */}
        <View className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
           <Leaf size={120} className="text-slate-900 dark:text-slate-100" />
        </View>

        {/* Details Row */}
        <View className="gap-2.5 mb-5 z-10">
          <View className="flex-row items-center gap-2">
            <Sprout size={16} className="text-slate-400 dark:text-slate-500" />
            <Text className="flex-1 text-[13px] font-semibold text-slate-600 dark:text-slate-300" numberOfLines={1}>
              {speciesName || t("plant.card.unknownSpecies")}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <MapPin size={16} className="text-slate-400 dark:text-slate-500" />
            <Text className="flex-1 text-[13px] font-semibold text-slate-600 dark:text-slate-300" numberOfLines={1}>
              {actualFarmPlotName}
            </Text>
          </View>
          {plant.plantingDate && (
            <View className="flex-row items-center gap-2">
              <CalendarDays size={16} className="text-slate-400 dark:text-slate-500" />
              <Text className="flex-1 text-[13px] font-semibold text-slate-600 dark:text-slate-300" numberOfLines={1}>
                {formatDate(plant.plantingDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer: Actions */}
        <View className="mt-auto flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800 z-10">
          {selected ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5">
               <Check size={14} color="#fff" strokeWidth={3} />
               <Text className="text-xs font-bold text-white">{t("common.selected", "Đã chọn")}</Text>
            </View>
          ) : (
            <View className="flex-row gap-2">
              {plant.tagCode && (
                <View className="items-center justify-center rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
                  <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {plant.tagCode}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="flex-row gap-1.5">
            <TouchableOpacity
              className="items-center justify-center rounded-full bg-slate-50 p-2 dark:bg-slate-800 hover:bg-slate-100"
              onPress={() => onEdit(plant.id)}
            >
              <Pencil size={15} className="text-slate-500 dark:text-slate-400" />
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center justify-center rounded-full bg-red-50 p-2 dark:bg-red-900/20"
              onPress={() => onDelete(plant)}
            >
              <Trash2 size={15} className="text-red-500 dark:text-red-400" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      className={`mb-4 overflow-hidden rounded-3xl border p-4 shadow-sm ${
        selected
          ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/20"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <View className="flex-row gap-4">
        {/* Left Icon Container */}
        <View
          className={`h-16 w-16 items-center justify-center rounded-2xl ${
            selected
              ? "bg-emerald-500"
              : "bg-emerald-50 dark:bg-emerald-900/30"
          }`}
        >
          {selected ? (
            <Check size={28} color="#fff" strokeWidth={3} />
          ) : (
            <Leaf
              size={28}
              className="text-emerald-600 dark:text-emerald-400"
              strokeWidth={2.5}
            />
          )}
        </View>

        {/* Middle Content */}
        <View className="flex-1 justify-center">
          <View className="mb-1 flex-row items-center justify-between">
             <Text
               className="text-lg font-black text-slate-800 dark:text-slate-100"
               numberOfLines={1}
             >
               {plant.plantNumber}
             </Text>
             <StatusBadge label={plant.plantStatus} variant="success" />
          </View>
          
          <Text
            className="mb-3 text-[13px] font-bold text-emerald-600 dark:text-emerald-400"
            numberOfLines={1}
          >
            {plant.nickName?.trim() || t("plant.card.noNickname")}
          </Text>

          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2.5">
            <View className="flex-row items-center gap-1.5">
              <Sprout size={14} className="text-slate-400 dark:text-slate-500" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {speciesName || t("plant.card.unknownSpecies")}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {actualFarmPlotName}
              </Text>
            </View>
            {plant.plantingDate && (
              <View className="flex-row items-center gap-1.5">
                <CalendarDays size={14} className="text-slate-400 dark:text-slate-500" />
                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {formatDate(plant.plantingDate)}
                </Text>
              </View>
            )}
            {plant.tagCode && (
              <View className="flex-row items-center gap-1.5">
                 <Hash size={12} className="text-slate-400 dark:text-slate-500" />
                 <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                   {plant.tagCode}
                 </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Actions */}
        <View className="justify-between items-end pl-2">
          <View className="flex-col gap-2 mt-auto">
            <TouchableOpacity
              className="items-center justify-center rounded-full bg-slate-50 p-2 dark:bg-slate-800"
              onPress={() => onEdit(plant.id)}
            >
              <Pencil size={16} className="text-slate-500 dark:text-slate-400" />
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center justify-center rounded-full bg-red-50 p-2 dark:bg-red-900/20"
              onPress={() => onDelete(plant)}
            >
              <Trash2 size={16} className="text-red-500 dark:text-red-400" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
