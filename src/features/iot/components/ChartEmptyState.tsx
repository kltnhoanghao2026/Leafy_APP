import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export function ChartEmptyState() {
  const { t } = useTranslation();

  return (
    <View style={styles.empty}>
      <Text style={styles.title}>{t("iot.metrics.zone.noChartData")}</Text>
      <Text style={styles.text}>
        {t("iot.metrics.zone.noChartDataDescription")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: 16,
  },
  text: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  title: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
  },
});
