import { StyleSheet, Text, View } from "react-native";

import type { DeviceStatus } from "../types";
import {
  getDeviceStatusColor,
  getDeviceStatusLabel,
} from "../utils/deviceLabels";

type DeviceStatusBadgeProps = {
  status?: DeviceStatus | null;
};

export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const color = getDeviceStatusColor(status);

  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{getDeviceStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
