export const SENSOR_LABELS: Record<string, string> = {
  AIR_TEMP: "Nhiệt độ không khí",
  AIR_HUMIDITY: "Độ ẩm không khí",
  SOIL_MOISTURE: "Độ ẩm đất",
  LIGHT_INTENSITY: "Cường độ ánh sáng",
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
    return sensorName || "Cảm biến";
  }

  return SENSOR_LABELS[sensorCode] || sensorName || sensorCode;
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
