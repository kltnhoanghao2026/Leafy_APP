import type { TFunction } from "i18next";

export type IotAlertNotificationPayload = {
  title?: string;
  body?: string;
  titleKey?: string;
  bodyKey?: string;
  alertType?: string;
  type?: string;
  referenceId?: string;
  alertEventId?: string;
  alertId?: string;
  mediaEventId?: string;
  analysisId?: string;
  diseaseName?: string;
  confidence?: string;
  deviceUid?: string;
  timestamp?: string;
};

const IOT_ALERT_TYPES = new Set([
  "IOT_ALERT",
  "IOT_ALERT_EVENT",
  "ALERT_EVENT",
  "ALERT_TRIGGERED",
  "DEVICE_ALERT",
]);

export const getIotAlertIdFromPayload = (
  data?: Record<string, unknown> | null,
): string | null => {
  if (!data) {
    return null;
  }

  return (
    getStringValue(data.referenceId) ??
    getStringValue(data.alertEventId) ??
    getStringValue(data.alertId)
  );
};

const getStringValue = (value: unknown): string | null => {
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export const isIotAlertNotification = (
  data?: Record<string, unknown> | null,
): boolean => {
  if (!data) {
    return false;
  }

  if (getIotAlertIdFromPayload(data)) {
    const type = data.type;
    if (typeof type === "string") {
      return IOT_ALERT_TYPES.has(type) || type.includes("ALERT");
    }

    return typeof data.alertType === "string" || typeof data.deviceUid === "string";
  }

  return false;
};

export const getIotAlertRoute = (
  data?: Record<string, unknown> | null,
): string | null => {
  const alertId = getIotAlertIdFromPayload(data);
  return alertId ? `/(main)/iot/alerts/${alertId}` : null;
};

export const resolveIotNotificationText = (
  data: IotAlertNotificationPayload,
  t: TFunction,
) => {
  const title = data.titleKey
    ? t(data.titleKey, { defaultValue: data.title ?? "" })
    : data.title || t("iot.alerts.notificationTitle");
  const body = data.bodyKey
    ? t(data.bodyKey, { defaultValue: data.body ?? "" })
    : data.body || t("iot.alerts.notificationBody");

  return { title, body };
};
