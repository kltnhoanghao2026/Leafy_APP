import { View, Text } from "react-native";
import { ClipboardList, CheckCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { homeStyles as styles } from "./home.styles";

type PlanApplyStatsCardProps = {
  activePlanApplies: number;
  completedPlanApplies: number;
  totalPlans: number;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
};

export function PlanApplyStatsCard({
  activePlanApplies,
  completedPlanApplies,
  totalPlans,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
}: PlanApplyStatsCardProps) {
  const { t } = useTranslation();

  return (
    <View
      style={[
        { backgroundColor: cardBg, borderColor: cardBorder },
        { padding: 16, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t("plantManagement.overview.planStatsTitle", "Plan Analytics")}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: "600", color: subTextColor }}>
          {t("plantManagement.overview.totalPlans", { count: totalPlans })}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(59,130,246,0.05)", borderRadius: 12, padding: 12, borderColor: "rgba(59,130,246,0.1)", borderWidth: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <ClipboardList size={16} color="#3B82F6" />
            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: "700", color: "#3B82F6" }}>
              {t("plantManagement.overview.activeApplies", "Active Applies")}
            </Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: textColor }}>{activePlanApplies}</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: "rgba(16,185,129,0.05)", borderRadius: 12, padding: 12, borderColor: "rgba(16,185,129,0.1)", borderWidth: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: "700", color: "#10B981" }}>
              {t("plantManagement.overview.completedApplies", "Completed Applies")}
            </Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: textColor }}>{completedPlanApplies}</Text>
        </View>
      </View>
    </View>
  );
}
