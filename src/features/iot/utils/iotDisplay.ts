import i18n from "@/src/i18n";

import type {
  AlertEventDetailResponse,
  AlertEventItemResponse,
  AlertRuleResponse,
  DeviceCameraSchedule,
  DeviceMediaAnalysis,
  DeviceMediaEvent,
  DisplayAlertEvent,
  DisplayAlertRule,
  DisplayCameraSchedule,
  DisplayDeviceMediaEvent,
  DisplayMediaAnalysis,
  PagedResponse,
} from "../types";
import { getAlertSeverityLabel, getAlertStatusLabel } from "./alertLabels";
import { formatDateTime, formatDeviceCode } from "./deviceLabels";
import { getSensorLabel, getSensorUnit } from "./sensorLabels";

export type {
  DisplayAlertEvent,
  DisplayAlertRule,
  DisplayCameraSchedule,
  DisplayDeviceCameraSchedule,
  DisplayDeviceMediaEvent,
} from "../types";

type EnumDisplayType =
  | "mediaStatus"
  | "scheduleStatus"
  | "analysisStatus"
  | "alertStatus"
  | "severity"
  | "resolution"
  | "quality"
  | "recurrence"
  | "triggerType";

type TimestampDisplay = {
  full: string;
  time: string;
  relative: string;
};

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
const currentLocale = () => i18n.resolvedLanguage ?? i18n.language ?? "en";

const noData = () => t("iot.common.noData", { defaultValue: "No data" });
const unknown = () => t("iot.common.unknown", { defaultValue: "Unknown" });

export const compactTechnicalId = (value?: string | null) => {
  if (!value) return undefined;
  return value.length > 14 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
};

const parseDate = (value?: string | Date | null) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const formatClockTime = (date?: Date) => {
  if (!date) return noData();
  return new Intl.DateTimeFormat(currentLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatRelativeTime = (date?: Date) => {
  if (!date) return noData();
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return t("iot.common.justNow", { defaultValue: "Just now" });
  }

  const formatter = new Intl.RelativeTimeFormat(currentLocale(), { numeric: "auto" });
  if (absSeconds < 3_600) {
    return formatter.format(Math.round(diffSeconds / 60), "minute");
  }
  if (absSeconds < 86_400) {
    return formatter.format(Math.round(diffSeconds / 3_600), "hour");
  }
  if (absSeconds < 604_800) {
    return formatter.format(Math.round(diffSeconds / 86_400), "day");
  }

  return formatter.format(Math.round(diffSeconds / 604_800), "week");
};

const timestampParts = (value?: string | Date | null): TimestampDisplay => {
  const date = parseDate(value);
  if (!date) {
    return { full: noData(), time: noData(), relative: noData() };
  }

  return {
    full: formatDateTime(date.toISOString()),
    time: formatClockTime(date),
    relative: formatRelativeTime(date),
  };
};

export const formatTimestamp = (value?: string | Date | null) => {
  const parts = timestampParts(value);
  if (parts.full === noData()) return parts.full;
  return `${parts.time} - ${parts.relative}`;
};

export const mapEnumToLocalized = (value: string | null | undefined, type: EnumDisplayType) => {
  if (!value) return unknown();

  if (type === "severity") return getAlertSeverityLabel(value);
  if (type === "alertStatus") return getAlertStatusLabel(value);

  const prefixByType = {
    mediaStatus: "iot.devices.media.status",
    scheduleStatus: "iot.cameraSchedules.statusOptions",
    analysisStatus: "iot.devices.media.analysisStatusOptions",
    resolution: "iot.cameraSchedules.resolutionOptions",
    quality: "iot.cameraSchedules.qualityOptions",
    recurrence: "iot.cameraSchedules.recurrence",
    triggerType: "iot.devices.media.triggerType",
  } as const;
  const key = `${prefixByType[type as keyof typeof prefixByType]}.${value}`;
  const label = t(key);
  return label === key ? unknown() : label;
};

export const formatScheduleTime = (value?: string | null) => {
  if (!value) return noData();
  return value.length >= 5 ? value.slice(0, 5) : value;
};

export const formatEndpointDisplay = (value?: string | null) => {
  if (!value) {
    return { label: t("iot.cameraSchedules.defaultUploadDestination", { defaultValue: "Default upload destination" }) };
  }

  try {
    const url = new URL(value);
    const internalHosts = ["localhost", "127.0.0.1", "0.0.0.0"];
    const isInternal = internalHosts.includes(url.hostname) || url.hostname.includes("file-service");
    return {
      label: isInternal
        ? t("iot.cameraSchedules.defaultUploadDestination", { defaultValue: "Default upload destination" })
        : t("iot.cameraSchedules.customUploadDestination", { defaultValue: "Custom upload destination configured" }),
      tooltip: value,
    };
  } catch {
    return {
      label: t("iot.cameraSchedules.customUploadDestination", { defaultValue: "Custom upload destination configured" }),
      tooltip: value,
    };
  }
};

const formatMediaSize = (media: DeviceMediaEvent) => {
  const dimensions =
    media.width && media.height
      ? `${media.width}x${media.height}`
      : t("iot.devices.media.unknownDimensions", { defaultValue: "Unknown dimensions" });
  const size =
    typeof media.sizeBytes === "number"
      ? t("iot.devices.media.bytes", {
          count: media.sizeBytes,
          defaultValue: `${media.sizeBytes} bytes`,
        })
      : t("iot.devices.media.unknownSize", { defaultValue: "Unknown size" });
  return `${dimensions} - ${size}`;
};

const formatPercent = (value?: number | null) => {
  if (typeof value !== "number") return noData();
  return `${Math.round(value * 100)}%`;
};

const formatAnalysisDisplay = (analysis?: DeviceMediaAnalysis | null): DisplayMediaAnalysis => {
  if (!analysis) {
    const notAnalyzed = t("iot.devices.media.noAnalysis", { defaultValue: "No analysis yet" });
    return {
      status: notAnalyzed,
      statusLabel: notAnalyzed,
      disease: unknown(),
      diseaseLabel: unknown(),
      severity: unknown(),
      severityLabel: unknown(),
      confidence: noData(),
      summary: notAnalyzed,
      alertBadge: "",
      analyzedAt: noData(),
      analyzedTime: noData(),
      analyzedRelative: noData(),
    };
  }

  const analyzed = timestampParts(analysis.analyzedAt ?? analysis.timestamp);
  const status = mapEnumToLocalized(analysis.analysisStatus ?? analysis.status, "analysisStatus");
  const disease = analysis.diseaseName || analysis.diseaseType || unknown();
  const severity = mapEnumToLocalized(analysis.severity, "severity");

  return {
    status,
    statusLabel: status,
    disease,
    diseaseLabel: disease,
    severity,
    severityLabel: severity,
    confidence: formatPercent(analysis.confidence),
    summary: analysis.diseaseDetected ? `${disease} - ${severity}` : status,
    alertBadge: analysis.alertEventId ? t("iot.devices.media.alertBadge", { defaultValue: "Alert linked" }) : "",
    analyzedAt: formatTimestamp(analysis.analyzedAt ?? analysis.timestamp),
    analyzedTime: analyzed.time,
    analyzedRelative: analyzed.relative,
  };
};

/**
 * Converts a raw camera/media event into UI-safe display fields.
 * Raw IDs remain available only under `display.technical` for cache keys,
 * mutations, admin diagnostics, or opt-in debug tooltips.
 */
export const withMediaDisplay = (rawMediaEvent: DeviceMediaEvent): DisplayDeviceMediaEvent => {
  const mainTimestamp = rawMediaEvent.uploadedAt ?? rawMediaEvent.capturedAt ?? rawMediaEvent.timestamp ?? rawMediaEvent.requestedAt;
  const main = timestampParts(mainTimestamp);
  const endpoint = formatEndpointDisplay(rawMediaEvent.uploadEndpoint);

  return {
    ...rawMediaEvent,
    display: {
      status: mapEnumToLocalized(rawMediaEvent.status, "mediaStatus"),
      statusLabel: mapEnumToLocalized(rawMediaEvent.status, "mediaStatus"),
      triggerType: mapEnumToLocalized(rawMediaEvent.triggerType, "triggerType"),
      triggerTypeLabel: mapEnumToLocalized(rawMediaEvent.triggerType, "triggerType"),
      timestamp: formatTimestamp(mainTimestamp),
      timestampLabel: formatTimestamp(mainTimestamp),
      timestampTime: main.time,
      timestampRelative: main.relative,
      requestedAt: formatTimestamp(rawMediaEvent.requestedAt),
      uploadedAt: formatTimestamp(rawMediaEvent.uploadedAt),
      capturedAt: formatTimestamp(rawMediaEvent.capturedAt),
      resolution: mapEnumToLocalized(rawMediaEvent.resolution, "resolution"),
      resolutionLabel: mapEnumToLocalized(rawMediaEvent.resolution, "resolution"),
      quality: mapEnumToLocalized(rawMediaEvent.quality, "quality"),
      qualityLabel: mapEnumToLocalized(rawMediaEvent.quality, "quality"),
      size: formatMediaSize(rawMediaEvent),
      sizeLabel: formatMediaSize(rawMediaEvent),
      endpoint: endpoint.label,
      endpointTooltip: endpoint.tooltip,
      fallbackMessage: rawMediaEvent.error || t("iot.devices.media.noImage", { defaultValue: "No image available" }),
      analysis: formatAnalysisDisplay(rawMediaEvent.analysis),
      technical: {
        id: compactTechnicalId(rawMediaEvent.id),
        requestId: compactTechnicalId(rawMediaEvent.requestId),
        fileId: compactTechnicalId(rawMediaEvent.fileId),
        mediaEventId: compactTechnicalId(rawMediaEvent.analysis?.mediaEventId ?? rawMediaEvent.id),
        deviceUid: compactTechnicalId(rawMediaEvent.deviceUid),
        endpoint: rawMediaEvent.uploadEndpoint ?? undefined,
      },
    },
  };
};

/**
 * Converts a raw camera schedule into display labels for schedule cards,
 * lists, and admin views while keeping `scheduleId` internal.
 */
export const withScheduleDisplay = (rawSchedule: DeviceCameraSchedule): DisplayCameraSchedule => {
  const lastMediaEvent = rawSchedule.lastMediaEvent ? withMediaDisplay(rawSchedule.lastMediaEvent) : rawSchedule.lastMediaEvent;
  const nextRun = timestampParts(rawSchedule.nextRunAt);
  const lastRun = timestampParts(rawSchedule.lastRunAt);
  const endpoint = formatEndpointDisplay(rawSchedule.uploadEndpoint);
  const mediaStatus = lastMediaEvent?.display.status ?? mapEnumToLocalized(rawSchedule.lastMediaStatus, "mediaStatus");
  const deviceLabel = rawSchedule.deviceId
    ? formatDeviceCode(rawSchedule.deviceId)
    : t("iot.common.deviceWithId", {
        id: compactTechnicalId(rawSchedule.deviceUid) ?? unknown(),
        defaultValue: `Device ${compactTechnicalId(rawSchedule.deviceUid) ?? unknown()}`,
      });
  const timeLabel = formatScheduleTime(rawSchedule.timeOfDay);
  const recurrenceLabel = mapEnumToLocalized(rawSchedule.recurrence, "recurrence");
  const enabledLabel = rawSchedule.enabled ? t("iot.cameraSchedules.enabled") : t("iot.cameraSchedules.disabled");
  const statusLabel = rawSchedule.status ? mapEnumToLocalized(rawSchedule.status, "scheduleStatus") : enabledLabel;
  const resolutionLabel = mapEnumToLocalized(rawSchedule.resolution, "resolution");
  const qualityLabel = mapEnumToLocalized(rawSchedule.quality, "quality");
  const nextRunLabel = formatTimestamp(rawSchedule.nextRunAt);
  const lastRunLabel = formatTimestamp(rawSchedule.lastRunAt);

  return {
    ...rawSchedule,
    lastMediaEvent,
    display: {
      device: deviceLabel,
      deviceLabel,
      timeOfDay: timeLabel,
      timeLabel,
      recurrence: recurrenceLabel,
      recurrenceLabel,
      enabled: enabledLabel,
      enabledLabel,
      status: statusLabel,
      statusLabel,
      resolution: resolutionLabel,
      resolutionLabel,
      quality: qualityLabel,
      qualityLabel,
      endpoint: endpoint.label,
      endpointLabel: endpoint.label,
      endpointTooltip: endpoint.tooltip,
      nextRunAt: nextRunLabel,
      nextRunLabel,
      nextRunTime: nextRun.time,
      nextRunRelative: nextRun.relative,
      lastRunAt: lastRunLabel,
      lastRunLabel,
      lastRunTime: lastRun.time,
      lastRunRelative: lastRun.relative,
      lastMediaStatus: mediaStatus,
      lastMediaStatusLabel: mediaStatus,
      technical: {
        scheduleId: compactTechnicalId(rawSchedule.scheduleId ?? rawSchedule.id),
        deviceUid: compactTechnicalId(rawSchedule.deviceUid),
        deviceId: compactTechnicalId(rawSchedule.deviceId),
        endpoint: rawSchedule.uploadEndpoint ?? undefined,
      },
    },
  };
};

export const formatAlertValue = (alert: AlertEventItemResponse) => {
  const sensorCode = alert.sensorCode || alert.alertType || undefined;
  const unit = getSensorUnit(sensorCode, alert.unit);
  const value = alert.triggerValue ?? alert.readingValue;
  return typeof value === "number" ? `${value.toFixed(1)}${unit ? ` ${unit}` : ""}` : noData();
};

const formatThreshold = (alert: AlertEventItemResponse) => {
  const sensorCode = alert.sensorCode || alert.alertType || undefined;
  const unit = getSensorUnit(sensorCode, alert.unit);
  const min = alert.thresholdMin;
  const max = alert.thresholdMax;
  if (min == null && max == null) return noData();
  if (min != null && max != null) return `${min}${unit ? ` ${unit}` : ""} - ${max}${unit ? ` ${unit}` : ""}`;
  if (max != null) {
    return t("iot.alerts.value.maxThreshold", {
      value: `${max}${unit ? ` ${unit}` : ""}`,
      defaultValue: `Max ${max}${unit ? ` ${unit}` : ""}`,
    });
  }
  return t("iot.alerts.value.minThreshold", {
    value: `${min}${unit ? ` ${unit}` : ""}`,
    defaultValue: `Min ${min}${unit ? ` ${unit}` : ""}`,
  });
};

/**
 * Converts a raw alert event into user-facing alert labels.
 * The alert ID stays in `display.technical.alertId` for internal operations.
 */
export const withAlertDisplay = <T extends AlertEventItemResponse | AlertEventDetailResponse>(
  rawAlert: T,
): DisplayAlertEvent<T> => {
  const opened = rawAlert.openedAt ?? rawAlert.triggeredAt ?? rawAlert.createdAt;
  const openedParts = timestampParts(opened);
  const createdParts = timestampParts(rawAlert.createdAt ?? opened);
  const sensorLabel = getSensorLabel(rawAlert.sensorCode || rawAlert.alertType || undefined, rawAlert.sensorName);
  const valueLabel = formatAlertValue(rawAlert);
  const thresholdLabel = formatThreshold(rawAlert);
  const deviceLabel = rawAlert.deviceName || t("iot.alerts.unknownDevice", { defaultValue: "Unknown device" });
  const zoneLabel = t("iot.alerts.unknownZone", { defaultValue: "Unknown zone" });
  const farmLabel = t("iot.alerts.unknownFarm", { defaultValue: "Unknown farm" });
  const severityLabel = mapEnumToLocalized(rawAlert.severity, "severity");
  const statusLabel = mapEnumToLocalized(rawAlert.status, "alertStatus");
  const openedAtLabel = formatTimestamp(opened);

  return {
    ...rawAlert,
    display: {
      type: sensorLabel,
      title: rawAlert.message || sensorLabel,
      message: rawAlert.message || t("iot.alerts.notificationBody", { defaultValue: "Alert requires attention" }),
      sensor: sensorLabel,
      sensorLabel,
      value: valueLabel,
      valueLabel,
      threshold: thresholdLabel,
      thresholdLabel,
      device: deviceLabel,
      deviceLabel,
      zone: zoneLabel,
      zoneLabel,
      farm: farmLabel,
      farmLabel,
      severity: severityLabel,
      severityLabel,
      status: statusLabel,
      statusLabel,
      createdAt: formatTimestamp(rawAlert.createdAt ?? opened),
      createdTime: createdParts.time,
      createdRelative: createdParts.relative,
      openedAt: openedAtLabel,
      openedAtLabel,
      openedTime: openedParts.time,
      openedRelative: openedParts.relative,
      acknowledgedAt: formatTimestamp(rawAlert.acknowledgedAt),
      acknowledgedAtLabel: formatTimestamp(rawAlert.acknowledgedAt),
      resolvedAt: formatTimestamp(rawAlert.resolvedAt),
      resolvedAtLabel: formatTimestamp(rawAlert.resolvedAt),
      technical: {
        alertId: compactTechnicalId(rawAlert.id),
        deviceId: compactTechnicalId(rawAlert.deviceId),
        zoneId: compactTechnicalId(rawAlert.zoneId),
        farmPlotId: compactTechnicalId(rawAlert.farmPlotId),
        ruleId: compactTechnicalId(rawAlert.alertRuleId ?? rawAlert.ruleId),
      },
    },
  };
};

const formatRuleThreshold = (rawRule: AlertRuleResponse) => {
  const min = rawRule.thresholdMin ?? rawRule.minThreshold;
  const max = rawRule.thresholdMax ?? rawRule.maxThreshold;
  const sensor = rawRule.sensorType ?? rawRule.sensorTypeId ?? undefined;
  const unit = getSensorUnit(sensor);

  if (min == null && max == null) return noData();
  if (min != null && max != null) return `${min}${unit ? ` ${unit}` : ""} - ${max}${unit ? ` ${unit}` : ""}`;
  if (max != null) return t("iot.rules.maxThreshold", { value: `${max}${unit ? ` ${unit}` : ""}`, defaultValue: `Max ${max}${unit ? ` ${unit}` : ""}` });
  return t("iot.rules.minThreshold", { value: `${min}${unit ? ` ${unit}` : ""}`, defaultValue: `Min ${min}${unit ? ` ${unit}` : ""}` });
};

/**
 * Converts a raw alert rule into display labels for rule lists and forms.
 * Rule identifiers are kept under `display.technical` and should not be rendered
 * in normal user-facing UI.
 */
export const withRuleDisplay = (rawRule: AlertRuleResponse): DisplayAlertRule => {
  const lastTriggered = timestampParts(rawRule.lastTriggeredAt);
  const sensorLabel = getSensorLabel(rawRule.sensorType ?? rawRule.sensorTypeId ?? undefined);
  const severityLabel = mapEnumToLocalized(rawRule.severity, "severity");
  const enabledLabel = rawRule.enabled ? t("iot.rules.enabled", { defaultValue: "Enabled" }) : t("iot.rules.disabled", { defaultValue: "Disabled" });
  const thresholdLabel = formatRuleThreshold(rawRule);
  const lastTriggeredLabel = formatTimestamp(rawRule.lastTriggeredAt);

  return {
    ...rawRule,
    display: {
      name: rawRule.name || sensorLabel,
      sensor: sensorLabel,
      sensorLabel,
      severity: severityLabel,
      severityLabel,
      enabled: enabledLabel,
      enabledLabel,
      threshold: thresholdLabel,
      thresholdLabel,
      lastTriggeredAt: lastTriggeredLabel,
      lastTriggeredLabel,
      lastTriggeredTime: lastTriggered.time,
      lastTriggeredRelative: lastTriggered.relative,
      createdAt: formatTimestamp(rawRule.createdAt),
      updatedAt: formatTimestamp(rawRule.updatedAt),
      technical: {
        ruleId: compactTechnicalId(rawRule.ruleId ?? rawRule.id),
        deviceId: compactTechnicalId(rawRule.deviceId),
        zoneId: compactTechnicalId(rawRule.zoneId),
        farmPlotId: compactTechnicalId(rawRule.farmPlotId),
      },
    },
  };
};

export const withAlertRuleDisplay = withRuleDisplay;

export const withPagedAlertDisplay = (
  response: PagedResponse<AlertEventItemResponse>,
): PagedResponse<DisplayAlertEvent> => ({
  ...response,
  items: response.items.map(withAlertDisplay),
  content: response.content?.map(withAlertDisplay),
});

/*
Usage examples for Phase 2 hook/component refactor:

const mediaDisplay = withMediaDisplay(rawMediaEvent);
mediaDisplay.display.status; // localized, user-facing label
mediaDisplay.display.technical.requestId; // internal/debug only, do not render in normal UI

const scheduleDisplay = withScheduleDisplay(rawSchedule);
scheduleDisplay.display.timeOfDay; // HH:mm
scheduleDisplay.display.endpoint; // Default upload / Custom endpoint

const alertDisplay = withAlertDisplay(rawAlert);
alertDisplay.display.severity; // localized severity label
alertDisplay.display.technical.alertId; // internal/debug only
*/
