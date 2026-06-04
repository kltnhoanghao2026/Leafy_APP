import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronRight, MoreHorizontal } from "lucide-react-native";

import type { DeviceResponse } from "../types";
import {
  formatDateTime,
  formatDeviceCode,
  getProvisioningStatusLabel,
} from "../utils/deviceLabels";
import { DeviceStatusBadge } from "./DeviceStatusBadge";
import { IoTStatusBadge, useIotTheme } from "./IoTUi";

type DeviceCardProps = {
  device: DeviceResponse;
  farmLabel?: string;
  zoneLabel?: string;
  onPress: (device: DeviceResponse) => void;
  onMorePress?: (device: DeviceResponse) => void;
};

export function DeviceCard({
  device,
  farmLabel: farmLabelProp,
  zoneLabel: zoneLabelProp,
  onPress,
  onMorePress,
}: DeviceCardProps) {
  const { t } = useTranslation();
  const theme = useIotTheme();
  const farmLabel = farmLabelProp ?? (device.farmPlotId ? t("iot.common.assigned") : t("iot.common.noFarmMetadata"));
  const zoneLabel = zoneLabelProp ?? (device.zoneId ? t("iot.common.assigned") : t("iot.common.noZoneMetadata"));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(device)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {device.deviceName || t("iot.devices.defaultName")}
          </Text>
          <Text style={[styles.code, { color: theme.subtle }]} numberOfLines={1}>
            {device.deviceCode ? formatDeviceCode(device.deviceCode) : t("iot.devices.noCode")}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {onMorePress ? (
            <Pressable
              accessibilityLabel={t("iot.devices.actions.more")}
              hitSlop={8}
              onPress={() => onMorePress(device)}
              style={[styles.moreButton, { backgroundColor: theme.cardAlt }]}
            >
              <MoreHorizontal color={theme.subtle} size={20} />
            </Pressable>
          ) : null}
          <ChevronRight color={theme.primary} size={20} />
        </View>
      </View>

      <View style={styles.metaRow}>
        <DeviceStatusBadge status={device.status} />
        <IoTStatusBadge label={getProvisioningStatusLabel(device.provisioningStatus)} tone="neutral" />
      </View>

      <View style={styles.details}>
        <Text style={[styles.detailText, { color: theme.subtle }]}>
          {t("iot.common.farm")}: {farmLabel}
        </Text>
        <Text style={[styles.detailText, { color: theme.subtle }]}>
          {t("iot.common.zone")}: {zoneLabel}
        </Text>
        <Text style={[styles.detailText, { color: theme.subtle }]}>
          {t("iot.devices.detail.lastSeenAt")}: {formatDateTime(device.lastSeenAt)}
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
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
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
  moreButton: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
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
