import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import type { DeviceResponse } from "../types";
import {
  formatDateTime,
  formatDeviceCode,
  getProvisioningStatusLabel,
} from "../utils/deviceLabels";
import { DeviceStatusBadge } from "./DeviceStatusBadge";

type DeviceCardProps = {
  device: DeviceResponse;
  onPress: (device: DeviceResponse) => void;
};

export function DeviceCard({ device, onPress }: DeviceCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(device)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {device.deviceName || "Thiết bị IoT"}
          </Text>
          <Text style={styles.code} numberOfLines={1}>
            {formatDeviceCode(device.deviceCode || device.deviceUid)}
          </Text>
        </View>
        <ChevronRight color="#94a3b8" size={20} />
      </View>

      <View style={styles.metaRow}>
        <DeviceStatusBadge status={device.status} />
        <Text style={styles.provisioning}>
          {getProvisioningStatusLabel(device.provisioningStatus)}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>Vườn: {device.farmPlotId || "Chưa gán"}</Text>
        <Text style={styles.detailText}>Khu vực: {device.zoneId || "Chưa gán"}</Text>
        <Text style={styles.detailText}>
          Lần cuối online: {formatDateTime(device.lastSeenAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  code: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
  },
  detailText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },
  details: {
    gap: 3,
    marginTop: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  name: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  provisioning: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 10,
  },
});
