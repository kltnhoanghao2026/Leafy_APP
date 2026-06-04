import i18n from "@/src/i18n";

import { getSensorLabel, getSensorUnit } from "../../iot/utils/sensorLabels";
import { getAlertSeverityLabel } from "../../iot/utils/alertLabels";
import type { EventType, PlantEventResponse } from "../components/plant-event.types";

export type AlertEventDetailField = {
  label: string;
  value: string;
  tone?: "danger" | "warning" | "info";
};

export type AlertEventDetails = {
  title: string;
  message?: string;
  fields: AlertEventDetailField[];
};

const TECHNICAL_KEYS = new Set([
  "alertEventId",
  "alertRuleId",
  "ruleId",
  "deviceId",
  "farmPlotId",
  "farmZoneId",
  "plantId",
  "planApplyId",
]);

const ALERT_TYPE_LABELS: Record<string, string> = {
  THRESHOLD_HIGH: "iot.alerts.type.THRESHOLD_HIGH",
  THRESHOLD_LOW: "iot.alerts.type.THRESHOLD_LOW",
  THRESHOLD_RANGE: "iot.alerts.type.THRESHOLD_RANGE",
  DEVICE_OFFLINE: "iot.alerts.type.DEVICE_OFFLINE",
  DEVICE_ONLINE: "iot.alerts.type.DEVICE_ONLINE",
  DISEASE_DETECTED: "iot.alerts.disease.type",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toReadableLabel = (value?: string | null) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const normalizeValue = (value: unknown) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const formatNumber = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return Number.isInteger(numeric) ? String(numeric) : String(Number(numeric.toFixed(2)));
};

const formatMetricValue = (value: string, sensorCode?: string | null) => {
  if (!value) return "";
  const unit = getSensorUnit(sensorCode);
  return `${formatNumber(value)}${unit}`;
};

const label = (key: string, fallback: string) => String(i18n.t(key, { defaultValue: fallback }));

const alertTypeLabel = (type?: string | null) => {
  if (!type) return label("iot.alerts.type.UNKNOWN", "Alert");
  const key = ALERT_TYPE_LABELS[type];
  return key ? label(key, toReadableLabel(type)) : toReadableLabel(type);
};

const parseKeyValuePayload = (description: string) => {
  const result: Record<string, string> = {};
  description.split(/[;\n]/).forEach(part => {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) return;
    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key && value) result[key] = value;
  });
  return result;
};

const parseDescriptionPayload = (description: string): Record<string, string> => {
  const trimmed = description.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isRecord(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed)
            .map(([key, value]) => [key, normalizeValue(value)])
            .filter(([, value]) => value),
        );
      }
    } catch {
      return parseKeyValuePayload(trimmed);
    }
  }

  return parseKeyValuePayload(trimmed);
};

const isAlertPayload = (eventType: EventType, payload: Record<string, string>) =>
  eventType === "ALERT_TRIGGERED" ||
  Boolean(payload.alertEventId || payload.alertType || payload.sensorTypeCode || payload.triggerValue);

const formatMessage = (
  message: string | undefined,
  sensorCode: string | undefined,
  triggerValue?: string,
  thresholdMin?: string,
  thresholdMax?: string,
) => {
  const sensor = getSensorLabel(sensorCode);
  const value = triggerValue ? formatMetricValue(triggerValue, sensorCode) : "";
  const min = thresholdMin ? formatMetricValue(thresholdMin, sensorCode) : "";
  const max = thresholdMax ? formatMetricValue(thresholdMax, sensorCode) : "";

  if (value && max && Number(triggerValue) > Number(thresholdMax)) {
    return i18n.t("iot.alerts.messages.aboveMax", { sensor, value, threshold: max });
  }

  if (value && min && Number(triggerValue) < Number(thresholdMin)) {
    return i18n.t("iot.alerts.messages.belowMin", { sensor, value, threshold: min });
  }

  if (!message && value) {
    return i18n.t("iot.alerts.messages.generic", { sensor, value });
  }

  if (!message) return i18n.t("iot.alerts.messageFallback");

  const unit = getSensorUnit(sensorCode);
  const highMatch = message.match(/^([A-Z_]+)\s+exceeded max threshold:\s*([\d.]+)\s*>\s*([\d.]+)/i);
  if (highMatch) {
    return i18n.t("iot.alerts.messages.aboveMax", {
      sensor: sensor || getSensorLabel(highMatch[1]),
      value: `${formatNumber(highMatch[2])}${unit}`,
      threshold: `${formatNumber(highMatch[3])}${unit}`,
    });
  }

  const lowMatch = message.match(/^([A-Z_]+)\s+(?:fell|dropped) below min threshold:\s*([\d.]+)\s*<\s*([\d.]+)/i);
  if (lowMatch) {
    return i18n.t("iot.alerts.messages.belowMin", {
      sensor: sensor || getSensorLabel(lowMatch[1]),
      value: `${formatNumber(lowMatch[2])}${unit}`,
      threshold: `${formatNumber(lowMatch[3])}${unit}`,
    });
  }

  return sensorCode ? message.replaceAll(sensorCode, sensor || sensorCode) : message;
};

export const formatPlantEventAlertDetails = (
  eventType: EventType,
  description?: string | null,
): AlertEventDetails | null => {
  if (!description) return null;

  const payload = parseDescriptionPayload(description);
  if (!isAlertPayload(eventType, payload)) return null;

  const sensorCode = payload.sensorTypeCode ?? payload.sensorCode;
  const fields: AlertEventDetailField[] = [];

  if (payload.alertType) {
    fields.push({
      label: label("plantEvent.alertDetails.type", "Alert type"),
      value: alertTypeLabel(payload.alertType),
      tone: "danger",
    });
  }

  if (payload.severity) {
    fields.push({
      label: label("plantEvent.alertDetails.severity", "Severity"),
      value: getAlertSeverityLabel(payload.severity as Parameters<typeof getAlertSeverityLabel>[0]),
      tone: payload.severity === "HIGH" || payload.severity === "CRITICAL" ? "danger" : "warning",
    });
  }

  if (sensorCode) {
    fields.push({ label: label("plantEvent.alertDetails.sensor", "Sensor"), value: getSensorLabel(sensorCode), tone: "info" });
  }

  if (payload.triggerValue) {
    fields.push({
      label: label("plantEvent.alertDetails.measuredValue", "Measured value"),
      value: formatMetricValue(payload.triggerValue, sensorCode),
      tone: "danger",
    });
  }

  const thresholdMin = payload.thresholdMin ? formatMetricValue(payload.thresholdMin, sensorCode) : "";
  const thresholdMax = payload.thresholdMax ? formatMetricValue(payload.thresholdMax, sensorCode) : "";
  if (thresholdMin || thresholdMax) {
    fields.push({
      label: label("plantEvent.alertDetails.safeRange", "Safe range"),
      value: thresholdMin && thresholdMax ? `${thresholdMin} - ${thresholdMax}` : thresholdMin || thresholdMax,
      tone: "warning",
    });
  }

  if (payload.deviceUid) {
    fields.push({ label: label("plantEvent.alertDetails.device", "Device"), value: payload.deviceUid, tone: "info" });
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (!value || TECHNICAL_KEYS.has(key)) return;
    if (["alertType", "severity", "sensorTypeCode", "sensorCode", "triggerValue", "thresholdMin", "thresholdMax", "deviceUid", "message"].includes(key)) return;
    fields.push({ label: toReadableLabel(key), value });
  });

  return {
    title: label("plantEvent.alertDetails.title", "Sensor alert"),
    message: formatMessage(
      payload.message,
      sensorCode,
      payload.triggerValue,
      payload.thresholdMin,
      payload.thresholdMax,
    ),
    fields,
  };
};

export const getPlantEventDisplayText = (
  event: Pick<PlantEventResponse, "eventType" | "note" | "description">,
) => {
  const alertDetails = formatPlantEventAlertDetails(event.eventType, event.description);

  return {
    alertDetails,
    title: alertDetails?.title ?? event.note ?? "",
    subtitle: alertDetails?.message ?? event.note ?? event.description ?? "",
  };
};
