import { StyleSheet, Text, View } from "react-native";

type MetricSummaryCardProps = {
  label: string;
  value: number | string;
  tone?: "green" | "blue" | "amber" | "red" | "slate";
};

const toneColors = {
  amber: ["#fffbeb", "#f59e0b", "#78350f"],
  blue: ["#eff6ff", "#3b82f6", "#1e3a8a"],
  green: ["#f0fdf4", "#22c55e", "#14532d"],
  red: ["#fff1f2", "#e11d48", "#881337"],
  slate: ["#f8fafc", "#94a3b8", "#0f172a"],
};

export function MetricSummaryCard({
  label,
  value,
  tone = "slate",
}: MetricSummaryCardProps) {
  const [backgroundColor, borderColor, color] = toneColors[tone];

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    width: "48%",
  },
  label: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
  },
  value: {
    fontSize: 26,
    fontWeight: "900",
  },
});
