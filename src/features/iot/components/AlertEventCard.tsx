import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import type { AlertEventItemResponse } from "../types";
import { formatDateTime } from "../utils/deviceLabels";
import { getSensorLabel, getSensorUnit } from "../utils/sensorLabels";
import { AlertSeverityBadge } from "./AlertSeverityBadge";
import { AlertStatusBadge } from "./AlertStatusBadge";

type AlertEventCardProps = {
  alert: AlertEventItemResponse;
  onPress: (alert: AlertEventItemResponse) => void;
};

export function AlertEventCard({ alert, onPress }: AlertEventCardProps) {
  const sensorCode = alert.sensorCode || alert.alertType || undefined;
  const value = alert.triggerValue ?? alert.readingValue;
  const unit = getSensorUnit(sensorCode, alert.unit);

  return (
    <Pressable
      onPress={() => onPress(alert)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.badges}>
          <AlertSeverityBadge severity={alert.severity} />
          <AlertStatusBadge status={alert.status} />
        </View>
        <ChevronRight color="#94a3b8" size={20} />
      </View>

      <Text style={styles.message} numberOfLines={2}>
        {alert.message}
      </Text>
      <Text style={styles.meta}>
        {getSensorLabel(sensorCode, alert.sensorName)}
        {typeof value === "number" ? ` • ${value.toFixed(1)}${unit ? ` ${unit}` : ""}` : ""}
      </Text>
      <Text style={styles.meta}>
        Device: {alert.deviceName || alert.deviceId || "Khong ro"} • Zone:{" "}
        {alert.zoneId || "Khong ro"}
      </Text>
      <Text style={styles.time}>
        {formatDateTime(alert.openedAt || alert.triggeredAt || alert.createdAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  message: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 12,
  },
  meta: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.76,
  },
  time: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 8,
  },
});
