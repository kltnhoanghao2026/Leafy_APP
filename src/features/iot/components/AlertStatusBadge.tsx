import { StyleSheet, Text, View } from "react-native";

import type { AlertStatus } from "../types";
import { getAlertStatusColor, getAlertStatusLabel } from "../utils/alertLabels";

export function AlertStatusBadge({ status }: { status?: AlertStatus | null }) {
  const color = getAlertStatusColor(status);

  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <Text style={[styles.text, { color }]}>{getAlertStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: "900",
  },
});
