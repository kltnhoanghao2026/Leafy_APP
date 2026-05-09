import type { DeviceStatus, ProvisioningStatus } from "../types";

export const getDeviceStatusLabel = (status?: DeviceStatus | null): string => {
  switch (status) {
    case "ONLINE":
      return "Đang online";
    case "OFFLINE":
      return "Đang offline";
    case "DISABLED":
      return "Đã vô hiệu";
    case "MAINTENANCE":
      return "Bảo trì";
    case "ERROR":
      return "Lỗi";
    case "PENDING":
      return "Đang chờ";
    default:
      return status ? String(status) : "Không rõ";
  }
};

export const getProvisioningStatusLabel = (
  status?: ProvisioningStatus | null,
): string => {
  switch (status) {
    case "PENDING":
      return "Đang chờ";
    case "PROVISIONED":
      return "Đã đăng ký";
    case "CLAIMED":
      return "Đã kết nối";
    case "DISABLED":
      return "Đã vô hiệu";
    case "UNCLAIMED":
      return "Chưa kết nối";
    default:
      return status ? String(status) : "Không rõ";
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
    return "Chưa có mã";
  }

  return deviceCode.length > 18
    ? `${deviceCode.slice(0, 8)}...${deviceCode.slice(-6)}`
    : deviceCode;
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
