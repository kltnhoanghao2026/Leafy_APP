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
    errors.push("iot.config.validation.samplingRequired");
  } else if (samplingIntervalSec < 5 || samplingIntervalSec > 3600) {
    errors.push("iot.config.validation.samplingRange");
  }

  if (publishIntervalSec === null) {
    errors.push("iot.config.validation.publishRequired");
  } else if (publishIntervalSec < 10 || publishIntervalSec > 86400) {
    errors.push("iot.config.validation.publishRange");
  }

  if (offlineTimeoutSec === null) {
    errors.push("iot.config.validation.offlineRequired");
  } else if (offlineTimeoutSec < 60 || offlineTimeoutSec > 86400) {
    errors.push("iot.config.validation.offlineRange");
  }

  if (
    samplingIntervalSec !== null &&
    publishIntervalSec !== null &&
    publishIntervalSec < samplingIntervalSec
  ) {
    errors.push("iot.config.validation.publishAfterSampling");
  }

  if (
    publishIntervalSec !== null &&
    offlineTimeoutSec !== null &&
    offlineTimeoutSec <= publishIntervalSec
  ) {
    errors.push("iot.config.validation.offlineAfterPublish");
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
