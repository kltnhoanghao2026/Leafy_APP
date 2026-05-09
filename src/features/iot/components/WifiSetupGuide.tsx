import { StyleSheet, Text, View } from "react-native";

const steps = [
  "Bật nguồn thiết bị.",
  "Nếu thiết bị chưa có Wi-Fi, kết nối Wi-Fi Leafy-Setup-xxxx.",
  "Mở trình duyệt tại http://192.168.4.1.",
  "Nhập Wi-Fi của vườn/nhà.",
  "Quay lại app và kéo để làm mới trạng thái thiết bị.",
];

export function WifiSetupGuide() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Thiết lập Wi-Fi cho thiết bị</Text>
      <Text style={styles.description}>
        Thiết bị đã được gán vào tài khoản. Nếu chưa online, hãy cấu hình Wi-Fi
        qua portal cục bộ của thiết bị.
      </Text>
      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
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
