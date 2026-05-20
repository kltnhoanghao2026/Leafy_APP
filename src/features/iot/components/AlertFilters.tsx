import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { AlertEventsParams, AlertSeverity, AlertStatus } from "../types";

export type AlertTimeRange = "H24" | "D7" | "D30" | "ALL";

type AlertFiltersProps = {
  status?: AlertStatus;
  severity?: AlertSeverity;
  deviceId?: string;
  zoneId?: string;
  timeRange: AlertTimeRange;
  onChange: (
    next: Pick<AlertEventsParams, "status" | "severity" | "deviceId" | "zoneId"> & {
      timeRange: AlertTimeRange;
    },
  ) => void;
};

const statusOptions: Array<{ labelKey: string; value?: AlertStatus }> = [
  { labelKey: "iot.common.all" },
  { labelKey: "iot.alerts.status.OPEN", value: "OPEN" },
  { labelKey: "iot.alerts.status.ACKNOWLEDGED", value: "ACKNOWLEDGED" },
  { labelKey: "iot.alerts.status.RESOLVED", value: "RESOLVED" },
];

const severityOptions: Array<{ labelKey: string; value?: AlertSeverity }> = [
  { labelKey: "iot.common.all" },
  { labelKey: "iot.alerts.severity.LOW", value: "LOW" },
  { labelKey: "iot.alerts.severity.MEDIUM", value: "MEDIUM" },
  { labelKey: "iot.alerts.severity.HIGH", value: "HIGH" },
  { labelKey: "iot.alerts.severity.CRITICAL", value: "CRITICAL" },
];

const timeOptions: Array<{ labelKey: string; value: AlertTimeRange }> = [
  { labelKey: "iot.alerts.time.H24", value: "H24" },
  { labelKey: "iot.alerts.time.D7", value: "D7" },
  { labelKey: "iot.alerts.time.D30", value: "D30" },
  { labelKey: "iot.common.all", value: "ALL" },
];

export function AlertFilters({
  status,
  severity,
  deviceId,
  zoneId,
  timeRange,
  onChange,
}: AlertFiltersProps) {
  const { t } = useTranslation();

  const update = (
    patch: Partial<{
      status?: AlertStatus;
      severity?: AlertSeverity;
      deviceId?: string;
      zoneId?: string;
      timeRange: AlertTimeRange;
    }>,
  ) => {
    onChange({
      status,
      severity,
      deviceId,
      zoneId,
      timeRange,
      ...patch,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("iot.alerts.filters.title")}</Text>
      <ChipGroup
        label={t("iot.alerts.filters.status")}
        options={statusOptions.map((option) => ({
          label: t(option.labelKey),
          value: option.value,
        }))}
        value={status}
        onSelect={(value) => update({ status: value })}
      />
      <ChipGroup
        label={t("iot.alerts.filters.severity")}
        options={severityOptions.map((option) => ({
          label: t(option.labelKey),
          value: option.value,
        }))}
        value={severity}
        onSelect={(value) => update({ severity: value })}
      />
      <View style={styles.group}>
        <Text style={styles.label}>{t("iot.alerts.filters.time")}</Text>
        <View style={styles.chips}>
          {timeOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => update({ timeRange: option.value })}
              style={[styles.chip, timeRange === option.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, timeRange === option.value && styles.chipTextActive]}>
                {t(option.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          autoCapitalize="none"
          onChangeText={(text) => update({ deviceId: text })}
          placeholder={t("iot.alerts.filters.deviceId")}
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={deviceId}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={(text) => update({ zoneId: text })}
          placeholder={t("iot.alerts.filters.zoneId")}
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={zoneId}
        />
      </View>
    </View>
  );
}

function ChipGroup<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value?: T;
  options: Array<{ label: string; value?: T }>;
  onSelect: (value?: T) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <Pressable
            key={option.label}
            onPress={() => onSelect(option.value)}
            style={[styles.chip, value === option.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, value === option.value && styles.chipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  chip: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  chipText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#166534",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  group: {
    gap: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 12,
    borderWidth: 1,
    color: "#0f172a",
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  title: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
});
