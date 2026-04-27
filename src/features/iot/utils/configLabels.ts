import type { DeviceConfigPushStatus } from "../types";
import { formatDateTime } from "./deviceLabels";

export const getConfigPushStatusLabel = (
  status?: DeviceConfigPushStatus | null,
): string => {
  switch (status) {
    case "PENDING":
      return "Dang cho";
    case "SENT":
      return "Da gui";
    case "ACKED":
      return "Thiet bi da xac nhan";
    case "FAILED":
      return "Thiet bi bao loi";
    default:
      return "Chua gui";
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
