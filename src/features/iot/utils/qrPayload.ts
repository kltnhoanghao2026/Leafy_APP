import type { DeviceQrPayload } from "../types";

export type ParseQrPayloadResult =
  | { ok: true; payload: DeviceQrPayload }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readRequiredString = (
  source: Record<string, unknown>,
  key: keyof DeviceQrPayload,
): string | null => {
  const value = source[key];
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return value.trim();
};

export const parseDeviceQrPayload = (rawValue: string): ParseQrPayloadResult => {
  const raw = rawValue.trim();
  if (!raw) {
    return { ok: false, error: "Nội dung QR đang trống." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      error: "QR không đúng định dạng JSON. Vui lòng kiểm tra lại nội dung.",
    };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: "QR phải là một object JSON chứa thông tin thiết bị." };
  }

  const deviceUid = readRequiredString(parsed, "deviceUid");
  const deviceCode = readRequiredString(parsed, "deviceCode");
  const deviceType = readRequiredString(parsed, "deviceType");

  if (!deviceUid) {
    return { ok: false, error: "QR thiếu deviceUid." };
  }

  if (!deviceCode) {
    return { ok: false, error: "QR thiếu deviceCode." };
  }

  if (!deviceType) {
    return { ok: false, error: "QR thiếu deviceType." };
  }

  return {
    ok: true,
    payload: {
      deviceUid,
      deviceCode,
      deviceType,
      model: typeof parsed.model === "string" ? parsed.model.trim() : undefined,
    },
  };
};

export const encodeQrPayloadParam = (payload: DeviceQrPayload): string => {
  return JSON.stringify(payload);
};
