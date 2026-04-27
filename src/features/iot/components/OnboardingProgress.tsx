import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type OnboardingProgressProps = {
  currentStep?: string;
};

const steps = [
  "Đang đăng ký thiết bị...",
  "Đang tạo mã xác nhận...",
  "Đang gán thiết bị vào khu vực...",
  "Đang cập nhật danh sách...",
];

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <View style={styles.card}>
      <ActivityIndicator color="#15803d" />
      <View style={styles.list}>
        {steps.map((step) => {
          const active = step === currentStep;

          return (
            <Text key={step} style={[styles.step, active && styles.activeStep]}>
              {active ? "• " : ""}{step}
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
