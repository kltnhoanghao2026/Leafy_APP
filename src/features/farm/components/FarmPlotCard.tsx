import { Text, TouchableOpacity, View } from "react-native";
import {
  Home,
  LandPlot,
  MapPin,
  Pencil,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useColorScheme } from "@/src/hooks/useColorScheme";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { PlotZonesList } from "./PlotZonesList";
import type { FarmPlotResponse, FarmZoneResponse } from "./farm.types";

type Props = {
  plot: FarmPlotResponse;
  formatArea: (m2: number) => string;
  onEditPlot: (id: string) => void;
  onDeletePlot: (id: string, name: string) => void;
  onCreateZone: (plotId: string, plotName: string) => void;
  onOpenPlants: (plotId: string, plotName: string) => void;
  onEditZone: (zone: FarmZoneResponse, plotName: string) => void;
  onDeleteZone: (zone: FarmZoneResponse) => void;
};

export function FarmPlotCard({
  plot,
  formatArea,
  onEditPlot,
  onDeletePlot,
  onCreateZone,
  onOpenPlants,
  onEditZone,
  onDeleteZone,
}: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center justify-between p-4 pb-3">
        <View className="flex-1 flex-row items-center mr-3 space-x-3">
          <View className="items-center justify-center rounded-xl bg-emerald-50 p-2 dark:bg-emerald-400/15">
            <Home
              size={24}
              className="text-emerald-700 dark:text-emerald-400"
              strokeWidth={2.5}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold text-slate-800 dark:text-slate-100"
              numberOfLines={1}
            >
              {plot.name}
            </Text>
            <Text
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              numberOfLines={1}
            >
              {t("farm.plotCard.code", { code: plot.code })}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="items-center justify-center rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => onEditPlot(plot.id)}
          >
            <Pencil size={16} className="text-slate-500 dark:text-slate-400" />
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center justify-center rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            onPress={() => onDeletePlot(plot.id, plot.name)}
          >
            <Trash2 size={18} className="text-slate-500 dark:text-slate-400" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center gap-2 px-4 pb-3">
        <View className="flex-row items-center rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800">
          <LandPlot
            size={16}
            className="text-emerald-600 dark:text-emerald-400"
          />
          <Text className="ml-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {formatArea(plot.areaM2)}
          </Text>
        </View>
        {plot.status && (
          <StatusBadge
            label={
              plot.status === "ACTIVE"
                ? t("common.status.active")
                : t("common.status.inactive")
            }
            variant={plot.status === "ACTIVE" ? "success" : "warning"}
          />
        )}
      </View>

      {plot.addressLine ? (
        <View className="mx-4 flex-row items-start border-t border-slate-100 py-3 dark:border-slate-800">
          <MapPin
            size={16}
            className="mt-0.5 text-slate-400 dark:text-slate-500"
          />
          <Text className="ml-1.5 flex-1 text-sm text-slate-500 dark:text-slate-400">
            {plot.addressLine}
          </Text>
        </View>
      ) : null}

      <PlotZonesList
        plotId={plot.id}
        formatArea={formatArea}
        onEditZone={(zone) => onEditZone(zone, plot.name)}
        onDeleteZone={onDeleteZone}
      />

      <TouchableOpacity
        className="mx-4 mt-2 flex-row items-center justify-center rounded-xl border border-emerald-600 bg-white py-3 dark:border-emerald-500 dark:bg-slate-900"
        onPress={() => onOpenPlants(plot.id, plot.name)}
      >
        <Sprout
          size={16}
          className="text-emerald-600 dark:text-emerald-500"
          strokeWidth={2.6}
        />
        <Text className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-500">
          {t("farm.plotCard.managePlants")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mx-4 mb-4 mt-2 flex-row items-center justify-center rounded-xl bg-emerald-600 py-3 dark:bg-emerald-500"
        onPress={() => onCreateZone(plot.id, plot.name)}
      >
        <Plus size={16} color="#FFFFFF" strokeWidth={3} />
        <Text className="ml-2 text-sm font-bold text-white">
          {t("farm.plotCard.addZone")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
