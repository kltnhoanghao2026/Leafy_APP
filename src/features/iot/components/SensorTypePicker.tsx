import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

const DEFAULT_SENSORS = [
  "AIR_TEMP",
  "AIR_HUMIDITY",
  "SOIL_MOISTURE",
  "LIGHT_INTENSITY",
] as const;

type SensorTypePickerProps = {
  value?: string | null;
  onChange: (sensorCode: string | null) => void;
  allowedSensors?: string[];
  label?: string;
};

export function SensorTypePicker({
  value,
  onChange,
  allowedSensors,
  label,
}: SensorTypePickerProps) {
  const { t } = useTranslation();
  const sensors = allowedSensors?.length ? allowedSensors : [...DEFAULT_SENSORS];
  const currentValue = value ?? "";

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label ?? t("iot.rules.sensor")}</Text>
      <View style={styles.chipRow}>
        {sensors.map((sensor) => {
          const selected = sensor === currentValue;
          const labelKey = `iot.rules.sensorOptions.${sensor}`;
          const translated = t(labelKey);
          const sensorLabel = translated === labelKey ? t("iot.rules.unknownSensor") : translated;

          return (
            <Pressable
              key={sensor}
              onPress={() => onChange(sensor)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {sensorLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  chipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextSelected: {
    color: "#166534",
  },
  container: {
    gap: 8,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
});
