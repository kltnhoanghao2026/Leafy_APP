import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react-native";

export function DeviceEmptyState() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <WifiOff color="#64748b" size={28} />
      </View>
      <Text style={styles.title}>{t("iot.devices.list.emptyTitle")}</Text>
      <Text style={styles.description}>
        {t("iot.devices.list.emptyDescription")}
      </Text>
      <View style={styles.disabledButton}>
        <Text style={styles.disabledButtonText}>{t("iot.devices.list.emptyAction")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 32,
    padding: 24,
  },
  description: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  disabledButtonText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "800",
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  title: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
  },
});
