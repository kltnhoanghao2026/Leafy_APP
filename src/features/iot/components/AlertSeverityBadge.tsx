import { StyleSheet, Text, View } from "react-native";

import type { AlertSeverity } from "../types";
import {
  getAlertSeverityColor,
  getAlertSeverityLabel,
} from "../utils/alertLabels";

export function AlertSeverityBadge({
  severity,
}: {
  severity?: AlertSeverity | null;
}) {
  const color = getAlertSeverityColor(severity);

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{getAlertSeverityLabel(severity)}</Text>
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
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});
