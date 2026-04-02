import { View, Text } from "react-native";
import { TriangleAlert, ChevronRight } from "lucide-react-native";
import { homeStyles as styles } from "./home.styles";

type AlertItem = {
  title: string;
  description: string;
};

type AlertsSectionProps = {
  textColor: string;
  alerts?: AlertItem[];
};

const DEFAULT_ALERTS: AlertItem[] = [
  {
    title: "Độ ẩm thấp",
    description: "Khu vực phía Đông cần tưới nước ngay.",
  },
];

export function AlertsSection({
  textColor,
  alerts = DEFAULT_ALERTS,
}: AlertsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Cảnh báo gần đây
      </Text>
      {alerts.map((alert, index) => (
        <View key={index} style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <TriangleAlert size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertDesc}>{alert.description}</Text>
          </View>
          <ChevronRight size={16} color="#EF4444" />
        </View>
      ))}
    </View>
  );
}
