import i18n from "@/src/i18n";

export const SENSOR_LABELS: Record<string, string> = {
  AIR_TEMP: "iot.metrics.sensors.AIR_TEMP",
  AIR_HUMIDITY: "iot.metrics.sensors.AIR_HUMIDITY",
  SOIL_MOISTURE: "iot.metrics.sensors.SOIL_MOISTURE",
  LIGHT_INTENSITY: "iot.metrics.sensors.LIGHT_INTENSITY",
};

export const SENSOR_UNIT_FALLBACKS: Record<string, string> = {
  AIR_TEMP: "°C",
  AIR_HUMIDITY: "%",
  SOIL_MOISTURE: "%",
  LIGHT_INTENSITY: "lux",
};

export const getSensorLabel = (
  sensorCode?: string | null,
  sensorName?: string | null,
): string => {
  if (!sensorCode) {
    return sensorName || i18n.t("iot.metrics.sensors.generic", { defaultValue: "Sensor" });
  }

  const key = SENSOR_LABELS[sensorCode];
  return key ? i18n.t(key) : sensorName || sensorCode;
};

export const getSensorUnit = (
  sensorCode?: string | null,
  unit?: string | null,
): string => {
  if (unit) {
    return unit;
  }

  if (!sensorCode) {
    return "";
  }

  return SENSOR_UNIT_FALLBACKS[sensorCode] || "";
};
