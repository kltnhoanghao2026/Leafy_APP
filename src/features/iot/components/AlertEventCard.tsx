import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronRight, Clock3, Cpu, Gauge, MapPin, Sprout } from "lucide-react-native";

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
        <View style={styles.headerMeta}>
          <Clock3 color="#94a3b8" size={14} />
          <Text style={styles.time} numberOfLines={1}>
            {alert.display?.openedAtLabel ?? t("iot.common.noData")}
          </Text>
          <ChevronRight color="#94a3b8" size={18} />
        </View>
      </View>

      <Text style={styles.message} numberOfLines={2}>
        {alert.display?.title ?? alert.display?.message ?? t("iot.alerts.notificationBody")}
      </Text>

      <View style={styles.metricBox}>
        <View style={styles.metricIcon}>
          <Gauge color="#166534" size={18} />
        </View>
        <View style={styles.metricContent}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            {alert.display?.sensorLabel ?? t("iot.common.unknown")}
          </Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {alert.display?.valueLabel ?? unknownValue}
          </Text>
        </View>
      </View>

      <View style={styles.locationBox}>
        <View style={styles.infoRow}>
          <Cpu color="#64748b" size={15} />
          <Text style={styles.infoText} numberOfLines={1}>
            {t("iot.common.device")}: {alert.display?.deviceLabel ?? unknownDevice}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin color="#64748b" size={15} />
          <Text style={styles.infoText} numberOfLines={1}>
            {t("iot.common.zone")}: {alert.display?.zoneLabel ?? unknownZone}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Sprout color="#64748b" size={15} />
          <Text style={styles.infoText} numberOfLines={1}>
            {t("iot.common.farm")}: {alert.display?.farmLabel ?? unknownFarm}
          </Text>
        </View>
      </View>
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
    padding: 18,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  headerMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 4,
    justifyContent: "flex-end",
    marginTop: 2,
  },
  highlighted: {
    borderColor: "#16a34a",
    borderWidth: 2,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  infoText: {
    color: "#475569",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  locationBox: {
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
  },
  message: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: 14,
  },
  metricBox: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 12,
  },
  metricContent: {
    flex: 1,
    gap: 3,
  },
  metricIcon: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  metricLabel: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.76,
  },
  time: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    maxWidth: 92,
  },
});
