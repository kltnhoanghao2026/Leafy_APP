import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from "react-native";
import { useTranslation } from "react-i18next";
import { TreePine, LayoutGrid, Leaf, ChevronRight } from "lucide-react-native";

export type PickerType = "plot" | "zone" | "plant" | null;

interface ApplyPlanScopeSelectorProps {
  farmPlotId: string;
  farmZoneId: string;
  plantId: string;
  selectedPlotName?: string;
  selectedZoneName?: string;
  selectedPlantLabel?: string | null;
  onOpenPicker: (type: PickerType) => void;
}

export function ApplyPlanScopeSelector({
  farmPlotId,
  farmZoneId,
  plantId,
  selectedPlotName,
  selectedZoneName,
  selectedPlantLabel,
  onOpenPicker,
}: ApplyPlanScopeSelectorProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={ss.container}>
      <View style={ss.headerBlock}>
        <Text style={[ss.headerTitle, isDark && ss.textDark]}>
          {t("plan.apply.scope", "Phạm vi áp dụng")}
        </Text>
        <Text style={ss.headerDesc}>
          {t("plan.apply.scopeDesc", "Vui lòng chọn phạm vi áp dụng (tối thiểu 1 Vườn). Chọn cấp độ chi tiết hơn sẽ giúp kế hoạch theo dõi chính xác hơn.")}
        </Text>
      </View>

      {/* Plot Selector */}
      <View style={ss.fieldBlock}>
        <View style={ss.fieldLabelRow}>
          <TreePine size={12} color="#94a3b8" />
          <Text style={ss.fieldLabel}>{t("plan.apply.plot", "Vườn")}</Text>
          <Text style={ss.required}>*</Text>
        </View>
        <TouchableOpacity
          onPress={() => onOpenPicker("plot")}
          style={[
            ss.selectorBtn,
            isDark && ss.selectorBtnDark,
            farmPlotId ? ss.selectorBtnActive : undefined,
          ]}
        >
          <Text style={[ss.selectorText, farmPlotId ? ss.selectorTextActive : ss.selectorTextPlaceholder]}>
            {selectedPlotName || t("plan.apply.selectPlot", "Chọn vườn...")}
          </Text>
          <ChevronRight size={18} color={farmPlotId ? "#059669" : "#94a3b8"} />
        </TouchableOpacity>
      </View>

      {/* Zone Selector */}
      <View style={[ss.fieldBlock, !farmPlotId && ss.fieldDisabled]}>
        <View style={ss.fieldLabelRow}>
          <LayoutGrid size={12} color="#94a3b8" />
          <Text style={ss.fieldLabel}>{t("plan.apply.zone", "Khu vực")}</Text>
        </View>
        <TouchableOpacity
          onPress={() => farmPlotId && onOpenPicker("zone")}
          disabled={!farmPlotId}
          style={[
            ss.selectorBtn,
            isDark && ss.selectorBtnDark,
            farmZoneId ? ss.selectorBtnActive : undefined,
          ]}
        >
          <Text style={[ss.selectorText, farmZoneId ? ss.selectorTextActive : ss.selectorTextPlaceholder]}>
            {selectedZoneName || t("plan.apply.selectZone", "Chọn khu vực...")}
          </Text>
          <ChevronRight size={18} color={farmZoneId ? "#059669" : "#94a3b8"} />
        </TouchableOpacity>
      </View>

      {/* Plant Selector */}
      <View style={[ss.fieldBlock, !farmPlotId && ss.fieldDisabled]}>
        <View style={ss.fieldLabelRow}>
          <Leaf size={12} color="#94a3b8" />
          <Text style={ss.fieldLabel}>{t("plan.apply.plant", "Cây cụ thể")}</Text>
        </View>
        <TouchableOpacity
          onPress={() => farmPlotId && onOpenPicker("plant")}
          disabled={!farmPlotId}
          style={[
            ss.selectorBtn,
            isDark && ss.selectorBtnDark,
            plantId ? ss.selectorBtnActive : undefined,
          ]}
        >
          <Text style={[ss.selectorText, plantId ? ss.selectorTextActive : ss.selectorTextPlaceholder]}>
            {selectedPlantLabel || t("plan.apply.selectPlant", "Chọn cây...")}
          </Text>
          <ChevronRight size={18} color={plantId ? "#059669" : "#94a3b8"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 16,
  },
  headerBlock: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#334155",
  },
  textDark: {
    color: "#e2e8f0",
  },
  headerDesc: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 4,
  },
  fieldBlock: {
    gap: 4,
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#94a3b8",
  },
  required: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "700",
  },
  selectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  selectorBtnDark: {
    borderColor: "#1e293b",
    backgroundColor: "#0f172a",
  },
  selectorBtnActive: {
    borderColor: "#a7f3d0",
    backgroundColor: "#ecfdf5",
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectorTextPlaceholder: {
    color: "#94a3b8",
  },
  selectorTextActive: {
    color: "#065f46",
  },
});
