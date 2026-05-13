import { View, Text } from "react-native";
import { CheckCircle2, Clock } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { homeStyles as styles } from "./home.styles";

type OverviewCompletionCardProps = {
  completed: number;
  pending: number;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
};

export function OverviewCompletionCard({
  completed,
  pending,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
}: OverviewCompletionCardProps) {
  const { t } = useTranslation();
  const total = completed + pending;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View
      style={[
        { backgroundColor: cardBg, borderColor: cardBorder },
        { padding: 16, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 16 }]}>
        {t("plantManagement.overview.completionTitle", "Task Completion")}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Progress Circle (Simplified for mobile) */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            borderWidth: 8,
            borderColor: "rgba(47,127,52,0.1)",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 20,
          }}
        >
          {total > 0 && (
            <View
              style={{
                position: "absolute",
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 8,
                borderColor: "#10B981",
                borderLeftColor: "transparent",
                borderBottomColor: "transparent",
                transform: [{ rotate: `${(percentage / 100) * 360 - 45}deg` }],
                opacity: percentage > 0 ? 1 : 0,
              }}
            />
          )}
          <Text style={{ fontSize: 18, fontWeight: "800", color: textColor }}>
            {percentage}%
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginRight: 8 }} />
            <Text style={{ flex: 1, fontSize: 14, color: subTextColor, fontWeight: "600" }}>
              {t("plantManagement.overview.completedEvents", "Completed")}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: textColor }}>{completed}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#F59E0B", marginRight: 8 }} />
            <Text style={{ flex: 1, fontSize: 14, color: subTextColor, fontWeight: "600" }}>
              {t("plantManagement.overview.pendingEvents", "Pending")}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: textColor }}>{pending}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
