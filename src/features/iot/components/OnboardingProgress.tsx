import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type OnboardingProgressProps = {
  currentStep?: string;
};

const stepKeys = [
  "iot.devices.onboarding.progressProvisioning",
  "iot.devices.onboarding.progressClaimCode",
  "iot.devices.onboarding.progressClaiming",
  "iot.devices.onboarding.progressRefreshing",
];

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <ActivityIndicator color="#15803d" />
      <View style={styles.list}>
        {stepKeys.map((stepKey) => {
          const step = t(stepKey);
          const active = step === currentStep;

          return (
            <Text key={stepKey} style={[styles.step, active && styles.activeStep]}>
              {active ? "- " : ""}{step}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeStep: {
    color: "#15803d",
    fontWeight: "900",
  },
  card: {
    alignItems: "flex-start",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  list: {
    flex: 1,
    gap: 5,
  },
  step: {
    color: "#64748b",
    fontSize: 13,
  },
});
