import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, useColorScheme } from "react-native";
import { useTranslation } from "react-i18next";
import { Play } from "lucide-react-native";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { PickerModal } from "@/src/components/ui/PickerModal";
import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";
import { useQuery } from "@tanstack/react-query";
import { useFarmPlotsByOwner, useFarmZonesByPlot } from "@/src/features/farm";
import { usePlantsByFarmPlot } from "@/src/features/plant";
import { useApplyPlanMutation } from "../../queries/plan.queries";

import { ApplyPlanDatePicker } from "./ApplyPlanDatePicker";
import { ApplyPlanScopeSelector, type PickerType } from "./ApplyPlanScopeSelector";
import { ApplyPlanExclusionSection } from "./ApplyPlanExclusionSection";

type ApplyPlanSheetProps = {
  planId: string;
  planName: string;
  onClose: () => void;
};

export function ApplyPlanSheet({ planId, planName, onClose }: ApplyPlanSheetProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  const [farmPlotId, setFarmPlotId] = useState<string>("");
  const [farmZoneId, setFarmZoneId] = useState<string>("");
  const [plantId, setPlantId] = useState<string>("");

  const [excludedFarmZoneIds, setExcludedFarmZoneIds] = useState<string[]>([]);
  const [excludedPlantIds, setExcludedPlantIds] = useState<string[]>([]);

  const [activePicker, setActivePicker] = useState<PickerType>(null);

  const profileQuery = useQuery(getMyProfileQueryOptions());
  const ownerProfileId = profileQuery.data?.id ?? "";

  const plotsQuery = useFarmPlotsByOwner(ownerProfileId);
  const zonesQuery = useFarmZonesByPlot(farmPlotId);
  const plantsQuery = usePlantsByFarmPlot(farmPlotId, { size: 1000 });

  const applyMutation = useApplyPlanMutation();

  const plots = plotsQuery.data ?? [];
  const zones = zonesQuery.data ?? [];
  const plants = plantsQuery.data?.content ?? [];

  const selectedPlotName = plots.find((p) => p.id === farmPlotId)?.name;
  const selectedZoneName = farmZoneId ? zones.find((z) => z.id === farmZoneId)?.zoneName : (farmPlotId ? t("common.all", "Tất cả") : undefined);
  const selectedPlant = plants.find((p) => p.id === plantId);
  const selectedPlantLabel = selectedPlant ? (selectedPlant.nickName || selectedPlant.plantNumber || selectedPlant.id) : null;

  const showExcludeZones = !!farmPlotId && !farmZoneId && !plantId;
  const showExcludePlants = !!farmPlotId && !plantId;

  const canSubmit = !!startDate && (!!plantId || !!farmPlotId || !!farmZoneId);

  const handleApply = async () => {
    if (!canSubmit) return;
    
    const isoDate = startDate.toISOString().split("T")[0]; // YYYY-MM-DD
    
    let targetName = "";
    if (plantId) targetName = selectedPlantLabel || "";
    else if (farmZoneId) targetName = selectedZoneName || "";
    else if (farmPlotId) targetName = selectedPlotName || "";
    
    try {
      await applyMutation.mutateAsync({
        planId,
        payload: {
          startDate: isoDate,
          ...(plantId ? { plantId } : {}),
          ...(farmPlotId && !plantId ? { farmPlotId } : {}),
          ...(farmZoneId && !plantId ? { farmZoneId } : {}),
          ...(excludedPlantIds.length > 0 ? { excludedPlantIds } : {}),
          ...(excludedFarmZoneIds.length > 0 ? { excludedFarmZoneIds } : {}),
          ...(targetName ? { targetName } : {}),
        }
      });
      onClose();
    } catch (e) {
      Alert.alert(t("common.error"), t("plan.apply.error", "Lỗi khi áp dụng kế hoạch"));
    }
  };

  const toggleExcludeZone = (id: string) => {
    setExcludedFarmZoneIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleExcludePlant = (id: string) => {
    setExcludedPlantIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <BottomSheet
      title={t("plan.apply.title", "Áp dụng kế hoạch")}
      titleColor={isDark ? "#ffffff" : "#0f172a"}
      heightPct="88%"
      onClose={onClose}
    >
      <ScrollView
        style={[s.scrollView, isDark && s.scrollViewDark]}
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.planNameBlock}>
          <Text style={s.planNameLabel}>{t("plan.apply.planName", "Kế hoạch")}</Text>
          <Text style={[s.planNameText, isDark && s.planNameTextDark]}>{planName}</Text>
        </View>

        <ApplyPlanDatePicker 
          startDate={startDate} 
          onDateChange={setStartDate} 
        />

        <ApplyPlanScopeSelector
          farmPlotId={farmPlotId}
          farmZoneId={farmZoneId}
          plantId={plantId}
          selectedPlotName={selectedPlotName}
          selectedZoneName={selectedZoneName}
          selectedPlantLabel={selectedPlantLabel}
          onOpenPicker={setActivePicker}
        />

        <ApplyPlanExclusionSection
          showExcludeZones={showExcludeZones}
          showExcludePlants={showExcludePlants}
          zones={zones}
          plants={plants}
          excludedFarmZoneIds={excludedFarmZoneIds}
          excludedPlantIds={excludedPlantIds}
          onToggleExcludeZone={toggleExcludeZone}
          onToggleExcludePlant={toggleExcludePlant}
        />
      </ScrollView>

      {/* Footer Action */}
      <View style={[s.footer, isDark && s.footerDark]}>
        <TouchableOpacity
          onPress={onClose}
          style={[s.cancelBtn, isDark && s.cancelBtnDark]}
          disabled={applyMutation.isPending}
        >
          <Text style={[s.cancelText, isDark && s.cancelTextDark]}>{t("common.cancel", "Hủy")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleApply}
          disabled={!canSubmit || applyMutation.isPending}
          style={[s.submitBtn, (!canSubmit || applyMutation.isPending) && s.submitBtnDisabled]}
        >
          <Play size={18} color="white" style={{ marginRight: 8 }} />
          <Text style={s.submitText}>
            {applyMutation.isPending ? t("common.processing", "Đang xử lý...") : t("plan.apply.submit", "Áp dụng")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pickers */}
      <PickerModal
        visible={activePicker === "plot"}
        title={t("plan.apply.selectPlot", "Chọn vườn")}
        items={[{ id: "", name: t("common.all", "Tất cả") }, ...plots]}
        keyExtractor={(p) => p.id}
        labelExtractor={(p) => p.name}
        selectedId={farmPlotId}
        onClose={() => setActivePicker(null)}
        onSelect={(id) => {
          setFarmPlotId(id);
          setFarmZoneId("");
          setPlantId("");
          setExcludedFarmZoneIds([]);
          setExcludedPlantIds([]);
          setActivePicker(null);
        }}
      />

      <PickerModal
        visible={activePicker === "zone"}
        title={t("plan.apply.selectZone", "Chọn khu vực")}
        items={[{ id: "", zoneName: t("common.all", "Tất cả") }, ...zones]}
        keyExtractor={(z) => z.id}
        labelExtractor={(z) => z.zoneName}
        selectedId={farmZoneId}
        onClose={() => setActivePicker(null)}
        onSelect={(id) => {
          setFarmZoneId(id);
          setPlantId("");
          setExcludedFarmZoneIds([]);
          setActivePicker(null);
        }}
      />

      <PickerModal
        visible={activePicker === "plant"}
        title={t("plan.apply.selectPlant", "Chọn cây")}
        items={[{ id: "", label: t("common.all", "Tất cả") }, ...plants.map(p => ({ id: p.id, label: p.nickName || p.plantNumber || p.id }))]}
        keyExtractor={(p) => p.id}
        labelExtractor={(p) => p.label}
        selectedId={plantId}
        onClose={() => setActivePicker(null)}
        onSelect={(id) => {
          setPlantId(id);
          setExcludedPlantIds([]);
          setActivePicker(null);
        }}
      />
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  scrollViewDark: {
    backgroundColor: "#020617",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  planNameBlock: {
    marginBottom: 24,
  },
  planNameLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#94a3b8",
    marginBottom: 6,
  },
  planNameText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 26,
  },
  planNameTextDark: {
    color: "#ffffff",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    gap: 12,
  },
  footerDark: {
    borderTopColor: "#1e293b",
    backgroundColor: "#020617",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  cancelBtnDark: {
    borderColor: "#334155",
    backgroundColor: "#0f172a",
  },
  cancelText: {
    fontWeight: "700",
    color: "#334155",
  },
  cancelTextDark: {
    color: "#cbd5e1",
  },
  submitBtn: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#059669",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontWeight: "900",
    color: "#ffffff",
    fontSize: 16,
  },
});
