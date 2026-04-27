import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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

const statusOptions: Array<{ label: string; value?: AlertStatus }> = [
  { label: "Tat ca" },
  { label: "Dang mo", value: "OPEN" },
  { label: "Da xac nhan", value: "ACKNOWLEDGED" },
  { label: "Da xu ly", value: "RESOLVED" },
];

const severityOptions: Array<{ label: string; value?: AlertSeverity }> = [
  { label: "Tat ca" },
  { label: "Thap", value: "LOW" },
  { label: "Trung binh", value: "MEDIUM" },
  { label: "Cao", value: "HIGH" },
  { label: "Nghiem trong", value: "CRITICAL" },
];

const timeOptions: Array<{ label: string; value: AlertTimeRange }> = [
  { label: "24h", value: "H24" },
  { label: "7 ngay", value: "D7" },
  { label: "30 ngay", value: "D30" },
  { label: "Tat ca", value: "ALL" },
];

export function AlertFilters({
  status,
  severity,
  deviceId,
  zoneId,
  timeRange,
  onChange,
}: AlertFiltersProps) {
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
      <Text style={styles.title}>Bo loc</Text>
      <ChipGroup
        label="Trang thai"
        options={statusOptions}
        value={status}
        onSelect={(value) => update({ status: value })}
      />
      <ChipGroup
        label="Muc do"
        options={severityOptions}
        value={severity}
        onSelect={(value) => update({ severity: value })}
      />
      <View style={styles.group}>
        <Text style={styles.label}>Thoi gian</Text>
        <View style={styles.chips}>
          {timeOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => update({ timeRange: option.value })}
              style={[styles.chip, timeRange === option.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, timeRange === option.value && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          autoCapitalize="none"
          onChangeText={(text) => update({ deviceId: text })}
          placeholder="deviceId"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={deviceId}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={(text) => update({ zoneId: text })}
          placeholder="zoneId"
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
