import type { AlertSeverity, AlertStatus } from "../types";

export const getAlertStatusLabel = (status?: AlertStatus | null): string => {
  switch (status) {
    case "OPEN":
      return "Dang mo";
    case "ACKNOWLEDGED":
      return "Da xac nhan";
    case "RESOLVED":
      return "Da xu ly";
    case "CLOSED":
      return "Da dong";
    default:
      return status ? String(status) : "Khong ro";
  }
};

export const getAlertStatusColor = (status?: AlertStatus | null): string => {
  switch (status) {
    case "OPEN":
      return "#be123c";
    case "ACKNOWLEDGED":
      return "#b45309";
    case "RESOLVED":
      return "#15803d";
    case "CLOSED":
      return "#64748b";
    default:
      return "#64748b";
  }
};

export const getAlertSeverityLabel = (severity?: AlertSeverity | null): string => {
  switch (severity) {
    case "LOW":
      return "Thap";
    case "MEDIUM":
      return "Trung binh";
    case "HIGH":
      return "Cao";
    case "CRITICAL":
      return "Nghiem trong";
    default:
      return severity ? String(severity) : "Khong ro";
  }
};

export const getAlertSeverityColor = (severity?: AlertSeverity | null): string => {
  switch (severity) {
    case "LOW":
      return "#15803d";
    case "MEDIUM":
      return "#b45309";
    case "HIGH":
      return "#ea580c";
    case "CRITICAL":
      return "#be123c";
    default:
      return "#64748b";
  }
};

export const getAlertTimeRange = (
  range: "H24" | "D7" | "D30" | "ALL",
): { from?: string; to?: string } => {
  if (range === "ALL") {
    return {};
  }

  const now = new Date();
  const from = new Date(now);

  if (range === "H24") {
    from.setHours(now.getHours() - 24);
  } else if (range === "D7") {
    from.setDate(now.getDate() - 7);
  } else {
    from.setDate(now.getDate() - 30);
  }

  return { from: from.toISOString(), to: now.toISOString() };
};
