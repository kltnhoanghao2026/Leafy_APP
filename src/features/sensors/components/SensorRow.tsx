import { View, Text, TouchableOpacity } from "react-native";
import { Share2, SlidersHorizontal, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { Sensor } from "./sensors.types";
import { BatteryBar } from "./BatteryBar";

export function SensorRow({
  sensor,
  zoneName,
  onEdit,
  onDelete,
}: {
  sensor: Sensor;
  zoneName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const isOnline = sensor.status === "online";
  const nameColor = isOnline
    ? "text-slate-900 dark:text-slate-100"
    : "text-slate-400 dark:text-slate-500";
  const statusColor = isOnline ? "text-emerald-500" : "text-slate-400";
  const statusBg = isOnline ? "bg-emerald-500" : "bg-slate-400";
  const iconColor = isOnline ? "#245A34" : "#94A3B8";

  return (
    <View className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800">
      {/* Top Row: Icon, Name, ID & Actions */}
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Share2 size={20} color={iconColor} strokeWidth={2.5} />
        </View>

        <View className="flex-1">
          <Text
            className={`text-[15px] font-bold ${nameColor}`}
            numberOfLines={1}
          >
            {sensor.name}
          </Text>
          <Text className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
            ID: {sensor.id}
          </Text>
        </View>

        <View className="flex-row gap-1.5">
          <TouchableOpacity
            onPress={onEdit}
            className="w-8 h-8 rounded-full items-center justify-center bg-slate-50 dark:bg-slate-800"
          >
            <SlidersHorizontal size={14} color="#64748B" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            className="w-8 h-8 rounded-full items-center justify-center bg-red-50 dark:bg-red-900/20"
          >
            <Trash2 size={14} color="#EF4444" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-slate-100 dark:bg-slate-800 my-3" />

      {/* Bottom Row: Status, Zone, Battery, Signal */}
      <View className="flex-row items-center flex-wrap gap-3">
        {/* Status */}
        <View className="flex-row items-center gap-1.5">
          <View className={`w-2 h-2 rounded-full ${statusBg}`} />
          <Text className={`text-[13px] font-bold capitalize ${statusColor}`}>
            {sensor.status === "online"
              ? t("common.status.online")
              : t("common.status.offline")}
          </Text>
        </View>

        <View className="w-px h-3 bg-slate-200 dark:bg-slate-700" />

        {/* Zone */}
        <Text
          className={`text-[13px] font-bold ${isOnline ? "text-slate-600 dark:text-slate-300" : "text-slate-400"}`}
          numberOfLines={1}
        >
          {zoneName}
        </Text>

        <View className="w-px h-3 bg-slate-200 dark:bg-slate-700" />

        {/* Battery */}
        <View className="flex-row items-center">
          <BatteryBar percentage={sensor.battery} />
        </View>
      </View>

      {/* Last Signal */}
      <Text className="text-[11px] text-slate-400 font-medium mt-2 self-end">
        {t("sensors.sensorRow.lastSignal", { signal: sensor.lastSignal })}
      </Text>
    </View>
  );
}
