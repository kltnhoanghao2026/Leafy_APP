import { StyleSheet, Text, View } from "react-native";

import type { DeviceConfigResponse } from "../types";
import {
  formatConfigDate,
  getConfigPushStatusColor,
  getConfigPushStatusLabel,
} from "../utils/configLabels";

type ConfigStatusCardProps = {
  config?: DeviceConfigResponse;
};

export function ConfigStatusCard({ config }: ConfigStatusCardProps) {
  const color = getConfigPushStatusColor(config?.lastPushStatus);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trang thai cau hinh</Text>
          <Text style={styles.subtitle}>Version {config?.configVersion ?? "-"}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
          <Text style={[styles.badgeText, { color }]}>
            {getConfigPushStatusLabel(config?.lastPushStatus)}
          </Text>
        </View>
      </View>

      <InfoLine label="ACK luc" value={formatConfigDate(config?.lastAckAt)} />
      <InfoLine label="Ap dung luc" value={formatConfigDate(config?.appliedAt)} />
      {config?.lastPushError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorLabel}>Loi tu thiet bi</Text>
          <Text style={styles.errorText}>{config.lastPushError}</Text>
        </View>
      ) : null}
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  errorLabel: {
    color: "#881337",
    fontSize: 12,
    fontWeight: "900",
  },
  errorText: {
    color: "#be123c",
    fontSize: 13,
    marginTop: 4,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    color: "#64748b",
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  infoLine: {
    flexDirection: "row",
    gap: 10,
  },
  infoValue: {
    color: "#0f172a",
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
  },
  title: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
});
