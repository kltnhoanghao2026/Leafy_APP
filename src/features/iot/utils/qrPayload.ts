import type { DeviceQrPayload } from "../types";

export type ParseQrPayloadResult =
  | { ok: true; payload: DeviceQrPayload }
  | { ok: false; error: string };

type QrPayloadTranslator = (key: string) => string;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readRequiredString = (
  source: Record<string, unknown>,
  key: "deviceUid" | "deviceCode" | "deviceType",
): string | null => {
  const value = source[key];
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return value.trim();
};

const readOptionalString = (
  source: Record<string, unknown>,
  key: "model" | "firmwareVersion" | "setupApSsid" | "setupPortalUrl",
): string | undefined => {
  const value = source[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

export const parseDeviceQrPayload = (
  rawValue: string,
  t: QrPayloadTranslator,
): ParseQrPayloadResult => {
  const raw = rawValue.trim();
  if (!raw) {
    return { ok: false, error: t("iot.devices.onboarding.qrEmpty") };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      error: t("iot.devices.onboarding.qrInvalidJson"),
    };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: t("iot.devices.onboarding.qrInvalid") };
  }

  if (parsed.type !== undefined && parsed.type !== "LEAFY_IOT_DEVICE") {
    return { ok: false, error: t("iot.devices.onboarding.qrNotLeafyDevice") };
  }

  if (parsed.version !== undefined && parsed.version !== 1) {
    return { ok: false, error: t("iot.devices.onboarding.qrUnsupportedVersion") };
  }

  const deviceUid = readRequiredString(parsed, "deviceUid");
  const deviceCode = readRequiredString(parsed, "deviceCode");
  const deviceType = readRequiredString(parsed, "deviceType");

  if (!deviceUid || !deviceCode || !deviceType) {
    return { ok: false, error: t("iot.devices.onboarding.qrMissingIdentity") };
  }

  return {
    ok: true,
    payload: {
      deviceUid,
      deviceCode,
      deviceType,
      model: readOptionalString(parsed, "model"),
      firmwareVersion: readOptionalString(parsed, "firmwareVersion"),
      setupApSsid: readOptionalString(parsed, "setupApSsid"),
      setupPortalUrl: readOptionalString(parsed, "setupPortalUrl"),
    },
  };
};

export const encodeQrPayloadParam = (payload: DeviceQrPayload): string => {
  return JSON.stringify(payload);
};
