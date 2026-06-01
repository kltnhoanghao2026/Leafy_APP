import i18n from "@/src/i18n";

export const SENSOR_LABELS: Record<string, string> = {
  AIR_TEMP: "iot.metrics.sensors.AIR_TEMP",
  AIR_HUMIDITY: "iot.metrics.sensors.AIR_HUMIDITY",
  SOIL_MOISTURE: "iot.metrics.sensors.SOIL_MOISTURE",
  LIGHT_INTENSITY: "iot.metrics.sensors.LIGHT_INTENSITY",
};

const SENSOR_CODE_ALIASES: Record<string, keyof typeof SENSOR_LABELS> = {
  AIR_TEMP: "AIR_TEMP",
  AIR_TEMPERATURE: "AIR_TEMP",
  TEMPERATURE: "AIR_TEMP",
  TEMP: "AIR_TEMP",
  DHT11_TEMP: "AIR_TEMP",
  "0728C31A-48FB-32DF-A03F-144E3FC0BF6D": "AIR_TEMP",

  AIR_HUMIDITY: "AIR_HUMIDITY",
  HUMIDITY: "AIR_HUMIDITY",
  RH: "AIR_HUMIDITY",
  DHT11_HUMIDITY: "AIR_HUMIDITY",
  "66105889-5971-39AE-A940-9DFAA611AA26": "AIR_HUMIDITY",

  SOIL_MOISTURE: "SOIL_MOISTURE",
  MOISTURE: "SOIL_MOISTURE",
  SOIL_MOISTURE_PCT: "SOIL_MOISTURE",
  SOIL_HUMIDITY: "SOIL_MOISTURE",
  "FB6D1DEC-8903-3C60-A84C-FCA5FA2FBBBC": "SOIL_MOISTURE",

  LIGHT_INTENSITY: "LIGHT_INTENSITY",
  LIGHT: "LIGHT_INTENSITY",
  LDR: "LIGHT_INTENSITY",
  ILLUMINANCE: "LIGHT_INTENSITY",
  "3930BA9C-4183-30B6-8F72-87411294E004": "LIGHT_INTENSITY",
};

export const SENSOR_UNIT_FALLBACKS: Record<string, string> = {
  AIR_TEMP: "°C",
  AIR_HUMIDITY: "%",
  SOIL_MOISTURE: "%",
  LIGHT_INTENSITY: "lux",
};

const GENERIC_SENSOR_LABEL = () =>
  i18n.t("iot.metrics.sensors.generic", { defaultValue: "Sensor" });

export const normalizeSensorCode = (
  sensorCode?: string | null,
  sensorName?: string | null,
): keyof typeof SENSOR_LABELS | undefined => {
  const candidates = [sensorCode, sensorName].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const normalized = candidate.trim().toUpperCase().replace(/[\s-]+/g, "_");
    const direct = SENSOR_CODE_ALIASES[normalized];
    if (direct) {
      return direct;
    }

    if (normalized.includes("SOIL") && normalized.includes("MOIST")) {
      return "SOIL_MOISTURE";
    }
    if (normalized.includes("HUMID")) {
      return "AIR_HUMIDITY";
    }
    if (normalized.includes("TEMP")) {
      return "AIR_TEMP";
    }
    if (normalized.includes("LIGHT") || normalized.includes("LDR") || normalized.includes("LUX")) {
      return "LIGHT_INTENSITY";
    }
  }

  return undefined;
};

export const getSensorLabel = (
  sensorCode?: string | null,
  sensorName?: string | null,
): string => {
  const normalizedCode = normalizeSensorCode(sensorCode, sensorName);
  const key = normalizedCode ? SENSOR_LABELS[normalizedCode] : undefined;
  if (key) return i18n.t(key);

  return sensorName && !/^[0-9a-f-]{24,}$/i.test(sensorName)
    ? sensorName
    : GENERIC_SENSOR_LABEL();
};

export const getSensorUnit = (
  sensorCode?: string | null,
  unit?: string | null,
): string => {
  if (unit) {
    return unit;
  }

  const normalizedCode = normalizeSensorCode(sensorCode);
  if (!normalizedCode) {
    return "";
  }

  return SENSOR_UNIT_FALLBACKS[normalizedCode] || "";
};
