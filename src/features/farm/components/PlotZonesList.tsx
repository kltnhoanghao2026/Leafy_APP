import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { Sprout, Pencil, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useFarmZonesByPlot } from "../queries";
import type { FarmZoneResponse } from "./farm.types";

type Props = {
  plotId: string;
  formatArea: (m2: number) => string;
  onEditZone?: (zone: FarmZoneResponse) => void;
  onDeleteZone?: (zone: FarmZoneResponse) => void;
};

export function PlotZonesList({
  plotId,
  formatArea,
  onEditZone,
  onDeleteZone,
}: Props) {
  const { t } = useTranslation();
  const { data: zones, isLoading } = useFarmZonesByPlot(plotId);

  if (isLoading) {
    return (
      <View className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <ActivityIndicator
          size="small"
          className="py-3 text-green-600 dark:text-green-400"
        />
      </View>
    );
  }

  if (!zones || zones.length === 0) return null;

  return (
    <View className="mx-4 border-t border-slate-100 pt-3 pb-2 dark:border-slate-800">
      <Text className="text-sm font-bold mb-3 text-slate-900 dark:text-white">
        {t("farm.plotCard.zonesSection")}
      </Text>

      {zones.map((zone) => (
        <View
          key={zone.id}
          className="flex-row items-center justify-between p-3 mb-2 border rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
        >
          <View className="flex-1 flex-row gap-3 items-center">
            <Sprout size={20} className="text-green-600 dark:text-green-400" />
            <View>
              <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                {zone.zoneName}
              </Text>
              <Text className="text-[13px] mt-0.5 text-slate-500 dark:text-slate-400">
                {zone.cropType || t("farm.plotCard.cropNotUpdated")} •{" "}
                {typeof zone.areaM2 === "number"
                  ? formatArea(zone.areaM2)
                  : t("farm.plotCard.areaNotSet")}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5 ml-2">
            {onEditZone ? (
              <TouchableOpacity
                className="w-8 h-8 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-800"
                onPress={() => onEditZone(zone)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Pencil
                  size={14}
                  className="text-slate-500 dark:text-slate-400"
                />
              </TouchableOpacity>
            ) : null}
            {onDeleteZone ? (
              <TouchableOpacity
                className="w-8 h-8 rounded-full items-center justify-center bg-red-50 dark:bg-red-950/30"
                onPress={() => onDeleteZone(zone)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Trash2 size={16} className="text-red-500 dark:text-red-400" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
