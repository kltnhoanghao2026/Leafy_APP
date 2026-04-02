import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Info, Check, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { FarmInfo } from "./sensors.types";

type Props = {
  farmInfo: FarmInfo | null;
  plotOptions: Array<{ id: string; name: string }>;
  selectedPlotId: string | null;
  onSelectPlot: (plotId: string) => void;
  onUpdate: (info: FarmInfo) => Promise<void> | void;
  isLoading: boolean;
  isSaving: boolean;
};

export function FarmInfoSection({
  farmInfo,
  plotOptions,
  selectedPlotId,
  onSelectPlot,
  onUpdate,
  isLoading,
  isSaving,
}: Props) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FarmInfo | null>(farmInfo);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setFormData(farmInfo);
  }, [farmInfo]);

  const handleSave = async () => {
    if (!formData) return;
    await onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(farmInfo);
    setIsEditing(false);
  };

  const updateFormField = (key: keyof FarmInfo, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  };

  return (
    <View className="rounded-3xl p-5 border shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center gap-2 flex-1 mr-2.5">
          <View className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center">
            <Info size={20} color="#245A34" strokeWidth={2.5} />
          </View>
          <Text
            className="text-[17px] font-bold text-[#245A34] dark:text-emerald-400"
            numberOfLines={1}
          >
            {t("sensors.farmInfo.title")}
          </Text>
        </View>

        <View className="flex-row gap-2 shrink-0">
          {isEditing ? (
            <>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={isSaving}
                className="w-8 h-8 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-800"
              >
                <X size={16} color="#64748B" strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  void handleSave();
                }}
                disabled={isSaving}
                className={`bg-[#245A34] dark:bg-emerald-600 px-4 py-2 flex-row items-center gap-1.5 rounded-full ${isSaving ? "opacity-70" : ""}`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                )}
                <Text className="text-white font-bold text-[13px]">
                  {t("common.save")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              disabled={!farmInfo || isLoading}
              className="bg-emerald-50 dark:bg-emerald-900/20 px-[14px] py-2 rounded-full"
            >
              <Text className="text-[#245A34] dark:text-emerald-400 font-bold text-[13px]">
                {t("common.update")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {plotOptions.length > 0 ? (
        <View className="mb-3.5">
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            {t("sensors.farmInfo.plotList")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {plotOptions.map((plot) => {
              const selected = plot.id === selectedPlotId;
              return (
                <TouchableOpacity
                  key={plot.id}
                  onPress={() => onSelectPlot(plot.id)}
                  className={`border px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5 ${
                    selected
                      ? "bg-[#245A34] dark:bg-emerald-600 border-[#245A34] dark:border-emerald-600"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Text
                    className={`font-bold text-[13px] ${selected ? "text-white" : "text-[#245A34] dark:text-emerald-400"}`}
                  >
                    {plot.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {isLoading ? (
        <View className="py-4">
          <Text className="text-slate-500 dark:text-slate-400 text-[13px]">
            {t("sensors.farmInfo.loading")}
          </Text>
        </View>
      ) : null}

      {!isLoading && !farmInfo ? (
        <View className="py-4">
          <Text className="text-slate-500 dark:text-slate-400 text-[13px] leading-5">
            {t("sensors.farmInfo.empty")}
          </Text>
        </View>
      ) : null}

      {/* Fields */}
      {farmInfo && formData ? (
        <View className="gap-3.5">
          <FieldRow
            label={t("sensors.farmInfo.farmName")}
            value={formData.name}
            isEditing={isEditing}
            placeholder={t("sensors.farmInfo.farmNamePlaceholder")}
            onChangeText={(v) => updateFormField("name", v)}
          />
          <FieldRow
            label={t("sensors.farmInfo.location")}
            value={formData.location}
            isEditing={isEditing}
            placeholder={t("sensors.farmInfo.locationPlaceholder")}
            onChangeText={(v) => updateFormField("location", v)}
          />
          <FieldRow
            label={t("sensors.farmInfo.area")}
            value={formData.area}
            isEditing={isEditing}
            placeholder={t("sensors.farmInfo.areaPlaceholder")}
            onChangeText={(v) => updateFormField("area", v)}
          />
        </View>
      ) : null}
    </View>
  );
}

function FieldRow({
  label,
  value,
  isEditing,
  placeholder,
  onChangeText,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  placeholder: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View>
      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={isEditing}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        className={`rounded-full px-4 py-3 text-[14px] font-semibold ${
          isEditing
            ? "bg-white dark:bg-slate-900 border-2 border-emerald-800/30 dark:border-emerald-400/30 text-slate-900 dark:text-white"
            : "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
        }`}
      />
    </View>
  );
}
