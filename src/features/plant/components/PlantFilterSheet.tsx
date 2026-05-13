import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { type PlantFilterParams } from "./plant.types";
import { useSpecies } from "../queries";
import { getSpeciesLabel } from "./plant.types";

import { useFarmPlotsByOwner, useFarmZonesByPlot } from "@/src/features/farm";
import { PickerModal } from "@/src/components/ui/PickerModal";
import { ChevronDown } from "lucide-react-native";

function FilterSelectField({
  label,
  valueLabel,
  onPress,
}: {
  label: string;
  valueLabel: string;
  onPress: () => void;
}) {
  return (
    <View className="mb-5">
      <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
        {label}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <Text className="text-sm font-semibold text-slate-900 dark:text-white">
          {valueLabel}
        </Text>
        <ChevronDown size={18} className="text-slate-400 dark:text-slate-500" />
      </TouchableOpacity>
    </View>
  );
}

type Props = {
  visible: boolean;
  initialFilters: PlantFilterParams;
  fixedFarmPlotId?: string;
  profileId?: string;
  onApply: (filters: PlantFilterParams) => void;
  onClose: () => void;
};

export function PlantFilterSheet({ visible, initialFilters, fixedFarmPlotId, profileId, onApply, onClose }: Props) {
  const { t } = useTranslation();
  
  const [speciesId, setSpeciesId] = useState<string>(initialFilters.speciesId ?? "");
  const [farmPlotId, setFarmPlotId] = useState<string>(initialFilters.farmPlotId ?? "");
  const [zoneId, setZoneId] = useState<string>(initialFilters.zoneId ?? "");
  const [status, setStatus] = useState<string>(initialFilters.status ?? "");

  const activePlotId = fixedFarmPlotId || farmPlotId;

  const { data: speciesPage } = useSpecies({
    page: 0,
    size: 100,
    sortBy: "commonName",
    sortDir: "ASC",
  });

  const { data: plots } = useFarmPlotsByOwner(profileId ?? "");
  const { data: zones } = useFarmZonesByPlot(activePlotId ?? "");

  const [speciesPickerVisible, setSpeciesPickerVisible] = useState(false);
  const [plotPickerVisible, setPlotPickerVisible] = useState(false);
  const [zonePickerVisible, setZonePickerVisible] = useState(false);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);

  const statusOptions = [
    { id: "", label: t("common.all", { defaultValue: "Tất cả" }) },
    { id: "ACTIVE", label: "ACTIVE" },
    { id: "INACTIVE", label: "INACTIVE" },
    { id: "ARCHIVED", label: "ARCHIVED" },
  ];

  const speciesOptions = [
    { id: "", label: t("common.all", { defaultValue: "Tất cả" }) },
    ...(speciesPage?.content ?? []).map((s) => ({ id: s.id, label: getSpeciesLabel(s) })),
  ];

  const plotOptions = [
    { id: "", label: t("common.all", { defaultValue: "Tất cả" }) },
    ...(plots ?? []).map((p) => ({ id: p.id, label: p.name })),
  ];

  const zoneOptions = [
    { id: "", label: t("common.all", { defaultValue: "Tất cả" }) },
    ...(zones ?? []).map((z) => ({ id: z.id, label: z.zoneName })),
  ];

  const handleApply = () => {
    onApply({
      ...initialFilters,
      speciesId,
      farmPlotId: fixedFarmPlotId ? undefined : farmPlotId,
      zoneId,
      status: status as any,
    });
  };

  const handleReset = () => {
    setSpeciesId("");
    if (!fixedFarmPlotId) {
      setFarmPlotId("");
    }
    setZoneId("");
    setStatus("");
    onApply({
      ...initialFilters,
      speciesId: "",
      farmPlotId: fixedFarmPlotId ? undefined : "",
      zoneId: "",
      status: "",
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BottomSheet
        title={t("plant.list.filterTitle", { defaultValue: "Lọc cây trồng" })}
        titleColor="#0F172A"
        heightPct="75%"
        onClose={onClose}
      >
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>

          <FilterSelectField
            label={t("plant.list.filterStatus", { defaultValue: "Trạng thái" })}
            valueLabel={statusOptions.find((o) => o.id === status)?.label ?? ""}
            onPress={() => setStatusPickerVisible(true)}
          />

          <FilterSelectField
            label={t("plant.list.filterSpecies", { defaultValue: "Giống cây" })}
            valueLabel={speciesOptions.find((o) => o.id === speciesId)?.label ?? ""}
            onPress={() => setSpeciesPickerVisible(true)}
          />

          {!fixedFarmPlotId && plots && plots.length > 0 && (
            <FilterSelectField
              label={t("plant.list.filterPlot", { defaultValue: "Vườn" })}
              valueLabel={plotOptions.find((o) => o.id === farmPlotId)?.label ?? ""}
              onPress={() => setPlotPickerVisible(true)}
            />
          )}

          {activePlotId && zones && zones.length > 0 && (
            <FilterSelectField
              label={t("plant.list.filterZone", { defaultValue: "Khu vực" })}
              valueLabel={zoneOptions.find((o) => o.id === zoneId)?.label ?? ""}
              onPress={() => setZonePickerVisible(true)}
            />
          )}
        </ScrollView>

        <View className="flex-row gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
          <TouchableOpacity
            onPress={handleReset}
            className="flex-1 items-center justify-center rounded-xl bg-slate-100 py-3.5 dark:bg-slate-800"
          >
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {t("common.reset", { defaultValue: "Đặt lại" })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApply}
            className="flex-1 items-center justify-center rounded-xl bg-emerald-600 py-3.5"
          >
            <Text className="text-sm font-bold text-white">
              {t("common.apply", { defaultValue: "Áp dụng" })}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <PickerModal
        visible={statusPickerVisible}
        title={t("plant.list.filterStatus", { defaultValue: "Trạng thái" })}
        items={statusOptions}
        selectedId={status}
        keyExtractor={(i) => i.id}
        labelExtractor={(i) => i.label}
        onClose={() => setStatusPickerVisible(false)}
        onSelect={(id) => {
          setStatus(id);
          setStatusPickerVisible(false);
        }}
      />

      <PickerModal
        visible={speciesPickerVisible}
        title={t("plant.list.filterSpecies", { defaultValue: "Giống cây" })}
        items={speciesOptions}
        selectedId={speciesId}
        keyExtractor={(i) => i.id}
        labelExtractor={(i) => i.label}
        onClose={() => setSpeciesPickerVisible(false)}
        onSelect={(id) => {
          setSpeciesId(id);
          setSpeciesPickerVisible(false);
        }}
      />

      <PickerModal
        visible={plotPickerVisible}
        title={t("plant.list.filterPlot", { defaultValue: "Vườn" })}
        items={plotOptions}
        selectedId={farmPlotId}
        keyExtractor={(i) => i.id}
        labelExtractor={(i) => i.label}
        onClose={() => setPlotPickerVisible(false)}
        onSelect={(id) => {
          setFarmPlotId(id);
          setZoneId(""); // reset zone when plot changes
          setPlotPickerVisible(false);
        }}
      />

      <PickerModal
        visible={zonePickerVisible}
        title={t("plant.list.filterZone", { defaultValue: "Khu vực" })}
        items={zoneOptions}
        selectedId={zoneId}
        keyExtractor={(i) => i.id}
        labelExtractor={(i) => i.label}
        onClose={() => setZonePickerVisible(false)}
        onSelect={(id) => {
          setZoneId(id);
          setZonePickerVisible(false);
        }}
      />
    </Modal>
  );
}
