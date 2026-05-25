import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react-native";

import type { AlertEventItemResponse } from "../types";
import { AlertSeverityBadge } from "./AlertSeverityBadge";
import { AlertStatusBadge } from "./AlertStatusBadge";
import type { DisplayAlertEvent } from "../utils/iotDisplay";

type AlertEventCardProps = {
  alert: AlertEventItemResponse & Partial<DisplayAlertEvent>;
  onPress: (alert: AlertEventItemResponse & Partial<DisplayAlertEvent>) => void;
  highlighted?: boolean;
};

export function AlertEventCard({ alert, onPress, highlighted }: AlertEventCardProps) {
  const { t } = useTranslation();
  const unknownDevice = t("iot.common.unknownDevice");
  const unknownZone = t("iot.common.unknownZone");
  const unknownFarm = t("iot.common.unknownFarm");
  const unknownValue = t("iot.common.unknownValue");

  return (
    <Pressable
      onPress={() => onPress(alert)}
      style={({ pressed }) => [
        styles.card,
        highlighted && styles.highlighted,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.badges}>
          <AlertSeverityBadge severity={alert.severity} />
          <AlertStatusBadge status={alert.status} />
        </View>
        <ChevronRight color="#94a3b8" size={20} />
      </View>

      <Text style={styles.message} numberOfLines={2}>
        {alert.display?.title ?? alert.display?.message ?? t("iot.alerts.notificationBody")}
      </Text>
      <Text style={styles.meta}>
        {alert.display?.sensorLabel ?? t("iot.common.unknown")}
        {" - "}
        {alert.display?.valueLabel ?? unknownValue}
      </Text>
      <Text style={styles.meta}>
        {t("iot.common.device")}: {alert.display?.deviceLabel ?? unknownDevice} - {t("iot.common.zone")}:{" "}
        {alert.display?.zoneLabel ?? unknownZone}
      </Text>
      <Text style={styles.meta}>
        {t("iot.common.farm")}: {alert.display?.farmLabel ?? unknownFarm}
      </Text>
      <Text style={styles.time}>
        {alert.display?.openedAtLabel ?? t("iot.common.noData")}
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
  highlighted: {
    borderColor: "#16a34a",
    borderWidth: 2,
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
