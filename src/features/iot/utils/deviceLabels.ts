import i18n from "@/src/i18n";

import type { DeviceStatus, ProvisioningStatus } from "../types";

const label = (key: string, fallback: string) =>
  i18n.t(key, { defaultValue: fallback });

export const getDeviceStatusLabel = (status?: DeviceStatus | null): string => {
  switch (status) {
    case "ONLINE":
      return label("iot.devices.status.ONLINE", "Online");
    case "OFFLINE":
      return label("iot.devices.status.OFFLINE", "Offline");
    case "DISABLED":
      return label("iot.devices.status.DISABLED", "Disabled");
    case "MAINTENANCE":
      return label("iot.devices.status.MAINTENANCE", "Maintenance");
    case "ERROR":
      return label("iot.devices.status.ERROR", "Error");
    case "PENDING":
      return label("iot.devices.status.PENDING", "Pending");
    default:
      return status ? String(status) : label("iot.common.unknown", "Unknown");
  }
};

export const getProvisioningStatusLabel = (
  status?: ProvisioningStatus | null,
): string => {
  switch (status) {
    case "PENDING":
      return label("iot.devices.provisioning.PENDING", "Pending");
    case "PROVISIONED":
      return label("iot.devices.provisioning.PROVISIONED", "Provisioned");
    case "CLAIMED":
      return label("iot.devices.provisioning.CLAIMED", "Claimed");
    case "DISABLED":
      return label("iot.devices.provisioning.DISABLED", "Disabled");
    case "UNCLAIMED":
      return label("iot.devices.provisioning.UNCLAIMED", "Unclaimed");
    default:
      return status ? String(status) : label("iot.common.unknown", "Unknown");
  }
};

export const getDeviceStatusColor = (status?: DeviceStatus | null): string => {
  switch (status) {
    case "ONLINE":
      return "#15803d";
    case "OFFLINE":
      return "#64748b";
    case "DISABLED":
      return "#475569";
    case "MAINTENANCE":
      return "#b45309";
    case "ERROR":
      return "#b91c1c";
    case "PENDING":
      return "#0369a1";
    default:
      return "#64748b";
  }
};

export const formatDeviceCode = (deviceCode?: string | null): string => {
  if (!deviceCode) {
    return label("iot.devices.noCode", "No code");
  }

  return deviceCode.length > 18
    ? `${deviceCode.slice(0, 8)}...${deviceCode.slice(-6)}`
    : deviceCode;
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return label("iot.common.noData", "No data");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(i18n.language || "en", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
