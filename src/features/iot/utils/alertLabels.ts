import i18n from "@/src/i18n";

import type { AlertSeverity, AlertStatus } from "../types";

const label = (key: string, fallback: string) =>
  i18n.t(key, { defaultValue: fallback });

export const getAlertStatusLabel = (status?: AlertStatus | null): string => {
  switch (status) {
    case "OPEN":
      return label("iot.alerts.status.OPEN", "Open");
    case "ACKNOWLEDGED":
      return label("iot.alerts.status.ACKNOWLEDGED", "Acknowledged");
    case "RESOLVED":
      return label("iot.alerts.status.RESOLVED", "Resolved");
    case "CLOSED":
      return label("iot.alerts.status.CLOSED", "Closed");
    default:
      return status ? String(status) : label("iot.common.unknown", "Unknown");
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
      return label("iot.alerts.severity.LOW", "Low");
    case "MEDIUM":
      return label("iot.alerts.severity.MEDIUM", "Medium");
    case "HIGH":
      return label("iot.alerts.severity.HIGH", "High");
    case "CRITICAL":
      return label("iot.alerts.severity.CRITICAL", "Critical");
    default:
      return severity ? String(severity) : label("iot.common.unknown", "Unknown");
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
