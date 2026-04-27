import { StyleSheet, Text, View } from "react-native";

export function ChartEmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.title}>Chưa có dữ liệu biểu đồ</Text>
      <Text style={styles.text}>
        Hãy thử khoảng thời gian khác hoặc đợi backend aggregate dữ liệu cảm biến.
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
