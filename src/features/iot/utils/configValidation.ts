import type { UpdateDeviceConfigRequest } from "../types";

export type ConfigFormValues = {
  samplingIntervalSec: string;
  publishIntervalSec: string;
  offlineTimeoutSec: string;
  alertEnabled: boolean;
};

export type ConfigValidationResult =
  | { ok: true; payload: UpdateDeviceConfigRequest }
  | { ok: false; errors: string[] };

const parseInteger = (value: string): number | null => {
  if (!/^\d+$/.test(value.trim())) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

export const validateConfigForm = (
  values: ConfigFormValues,
): ConfigValidationResult => {
  const errors: string[] = [];
  const samplingIntervalSec = parseInteger(values.samplingIntervalSec);
  const publishIntervalSec = parseInteger(values.publishIntervalSec);
  const offlineTimeoutSec = parseInteger(values.offlineTimeoutSec);

  if (samplingIntervalSec === null) {
    errors.push("Chu ky doc cam bien phai la so nguyen duong.");
  } else if (samplingIntervalSec < 5 || samplingIntervalSec > 3600) {
    errors.push("Chu ky doc cam bien phai trong khoang 5-3600 giay.");
  }

  if (publishIntervalSec === null) {
    errors.push("Chu ky gui du lieu phai la so nguyen duong.");
  } else if (publishIntervalSec < 10 || publishIntervalSec > 86400) {
    errors.push("Chu ky gui du lieu phai trong khoang 10-86400 giay.");
  }

  if (offlineTimeoutSec === null) {
    errors.push("Thoi gian xac dinh offline phai la so nguyen duong.");
  } else if (offlineTimeoutSec < 60 || offlineTimeoutSec > 86400) {
    errors.push("Thoi gian xac dinh offline phai trong khoang 60-86400 giay.");
  }

  if (
    samplingIntervalSec !== null &&
    publishIntervalSec !== null &&
    publishIntervalSec < samplingIntervalSec
  ) {
    errors.push("Chu ky gui du lieu nen lon hon hoac bang chu ky doc cam bien.");
  }

  if (
    publishIntervalSec !== null &&
    offlineTimeoutSec !== null &&
    offlineTimeoutSec < publishIntervalSec
  ) {
    errors.push("Thoi gian offline nen lon hon hoac bang chu ky gui du lieu.");
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    payload: {
      samplingIntervalSec: samplingIntervalSec as number,
      publishIntervalSec: publishIntervalSec as number,
      offlineTimeoutSec: offlineTimeoutSec as number,
      alertEnabled: values.alertEnabled,
    },
  };
};

export const createFormValuesFromConfig = (config?: {
  samplingIntervalSec?: number;
  publishIntervalSec?: number;
  offlineTimeoutSec?: number;
  alertEnabled?: boolean;
}): ConfigFormValues => ({
  samplingIntervalSec: String(config?.samplingIntervalSec ?? 60),
  publishIntervalSec: String(config?.publishIntervalSec ?? 300),
  offlineTimeoutSec: String(config?.offlineTimeoutSec ?? 900),
  alertEnabled: config?.alertEnabled ?? true,
});
