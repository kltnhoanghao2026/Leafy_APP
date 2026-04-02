import { Text, TouchableOpacity, View } from "react-native";
import { Leaf, Pencil, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import type { PlantResponse } from "./plant.types";

type Props = {
  plant: PlantResponse;
  speciesName?: string;
  onEdit: (plantId: string) => void;
  onDelete: (plant: PlantResponse) => void;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace("T", " ").slice(0, 16);
  }

  return date.toLocaleString();
};

export function PlantCard({ plant, speciesName, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between p-4 pb-2">
        <View className="flex-1 flex-row items-center mr-3 space-x-3">
          <View className="items-center justify-center rounded-xl bg-emerald-50 p-2 dark:bg-emerald-400/15">
            <Leaf
              size={22}
              className="text-emerald-700 dark:text-emerald-400"
              strokeWidth={2.4}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold text-slate-800 dark:text-slate-100"
              numberOfLines={1}
            >
              {plant.plantNumber}
            </Text>
            <Text
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              numberOfLines={1}
            >
              {plant.nickName?.trim() || t("plant.card.noNickname")}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="items-center justify-center rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => onEdit(plant.id)}
          >
            <Pencil size={16} className="text-slate-500 dark:text-slate-400" />
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center justify-center rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => onDelete(plant)}
          >
            <Trash2 size={18} className="text-slate-500 dark:text-slate-400" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 pb-3">
        <View className="self-start rounded-lg bg-emerald-50 px-2.5 py-1 dark:bg-emerald-900/20">
          <Text className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
            {plant.plantStatus}
          </Text>
        </View>

        <View className="mt-3 gap-1.5">
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {t("plant.card.species")}:{" "}
            {speciesName || t("plant.card.unknownSpecies")}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {t("plant.card.farmPlot")}: {plant.farmPlotId}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {t("plant.card.plantingDate")}: {formatDate(plant.plantingDate)}
          </Text>
        </View>
      </View>
    </View>
  );
}
