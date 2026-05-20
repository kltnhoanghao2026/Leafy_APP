import type { DeviceConfigPushStatus } from "../types";
import { formatDateTime } from "./deviceLabels";

export const getConfigPushStatusKey = (
  status?: DeviceConfigPushStatus | null,
): string => {
  switch (status) {
    case "PENDING":
      return "iot.config.status.PENDING";
    case "SENT":
      return "iot.config.status.SENT";
    case "ACKED":
      return "iot.config.status.ACKED";
    case "FAILED":
      return "iot.config.status.FAILED";
    default:
      return "iot.config.status.NOT_SENT";
  }
};

export const getConfigPushStatusLabel = (
  status?: DeviceConfigPushStatus | null,
): string => {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "SENT":
      return "Sent";
    case "ACKED":
      return "Acknowledged";
    case "FAILED":
      return "Failed";
    default:
      return "Not sent";
  }
};

export const getConfigPushStatusColor = (
  status?: DeviceConfigPushStatus | null,
): string => {
  switch (status) {
    case "ACKED":
      return "#15803d";
    case "FAILED":
      return "#be123c";
    case "SENT":
      return "#0369a1";
    case "PENDING":
      return "#b45309";
    default:
      return "#64748b";
  }
};

export const formatConfigDate = (value?: string | null): string => {
  return formatDateTime(value);
};
