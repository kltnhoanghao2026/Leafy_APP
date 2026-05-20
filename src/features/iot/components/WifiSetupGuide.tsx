import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

const stepKeys = [
  "iot.devices.onboarding.wifiStepPower",
  "iot.devices.onboarding.wifiStepConnect",
  "iot.devices.onboarding.wifiStepBrowser",
  "iot.devices.onboarding.wifiStepCredentials",
  "iot.devices.onboarding.wifiStepRefresh",
];

export function WifiSetupGuide() {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("iot.devices.onboarding.wifiTitle")}</Text>
      <Text style={styles.description}>
        {t("iot.devices.onboarding.wifiDescription")}
      </Text>
      <View style={styles.steps}>
        {stepKeys.map((stepKey, index) => (
          <View key={stepKey} style={styles.stepRow}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{t(stepKey)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  description: {
    color: "#92400e",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  indexBadge: {
    alignItems: "center",
    backgroundColor: "#f59e0b",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  indexText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  stepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  stepText: {
    color: "#78350f",
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  steps: {
    gap: 10,
    marginTop: 14,
  },
  title: {
    color: "#78350f",
    fontSize: 16,
    fontWeight: "900",
  },
});
