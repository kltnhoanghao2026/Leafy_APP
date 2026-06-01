import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PickerModal } from "@/src/components/ui/PickerModal";
import type { AlertEventsParams, AlertSeverity, AlertStatus } from "../types";
import { DevicePicker, type DevicePickerOption } from "./DevicePicker";
import { FarmPicker, type FarmPickerOption } from "./FarmPicker";
import { ZonePicker, type ZonePickerOption } from "./ZonePicker";

export type AlertTimeRange = "H24" | "D7" | "D30" | "ALL";

type AlertFiltersProps = {
  status?: AlertStatus;
  severity?: AlertSeverity;
  deviceId?: string;
  zoneId?: string;
  farmPlotId?: string;
  timeRange: AlertTimeRange;
  devices?: DevicePickerOption[];
  farms?: FarmPickerOption[];
  zones?: ZonePickerOption[];
  onChange: (
    next: Pick<
      AlertEventsParams,
      "status" | "severity" | "deviceId" | "zoneId"
    > & {
      farmPlotId?: string;
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
  farmPlotId,
  timeRange,
  devices = [],
  farms = [],
  zones = [],
  onChange,
}: AlertFiltersProps) {
  const { t } = useTranslation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const update = (
    patch: Partial<{
      status?: AlertStatus;
      severity?: AlertSeverity;
      deviceId?: string;
      zoneId?: string;
      farmPlotId?: string;
      timeRange: AlertTimeRange;
    }>,
  ) => {
    onChange({
      status,
      severity,
      deviceId,
      zoneId,
      farmPlotId,
      timeRange,
      ...patch,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("iot.alerts.filters.title")}</Text>
      <SelectDropdown
        label={t("iot.alerts.filters.status")}
        options={statusOptions.map((option) => ({
          label: t(option.labelKey),
          value: option.value,
        }))}
        value={status}
        onSelect={(value) => update({ status: value })}
      />
      <SelectDropdown
        label={t("iot.alerts.filters.severity")}
        options={severityOptions.map((option) => ({
          label: t(option.labelKey),
          value: option.value,
        }))}
        value={severity}
        onSelect={(value) => update({ severity: value })}
      />
      <SelectDropdown
        label={t("iot.alerts.filters.time")}
        options={timeOptions.map((option) => ({
          label: t(option.labelKey),
          value: option.value,
        }))}
        value={timeRange}
        onSelect={(value) => update({ timeRange: value ?? "D7" })}
      />
      <FarmPicker
        farms={farms}
        label={t("iot.alerts.filters.farm")}
        placeholder={t("iot.alerts.filters.farmPlaceholder")}
        value={farmPlotId}
        onChange={(farm) =>
          update({
            farmPlotId: farm?.id ?? "",
            zoneId: "",
          })
        }
      />
      <DevicePicker
        devices={devices}
        label={t("iot.alerts.filters.deviceId")}
        mode="deviceId"
        placeholder={t("iot.alerts.filters.devicePlaceholder")}
        value={deviceId}
        onChange={(device) =>
          update({
            deviceId: device?.deviceId ?? device?.id ?? "",
          })
        }
      />
      <ZonePicker
        label={t("iot.alerts.filters.zoneId")}
        placeholder={t("iot.alerts.filters.zonePlaceholder")}
        value={zoneId}
        zones={zones}
        onChange={(zone) => update({ zoneId: zone?.id ?? "" })}
      />
      <Pressable
        style={styles.advancedButton}
        onPress={() => setShowAdvancedFilters((visible) => !visible)}
      >
        <Text style={styles.advancedButtonText}>
          {showAdvancedFilters
            ? t("iot.common.hideTechnicalDetails")
            : t("iot.common.advancedFilters")}
        </Text>
      </Pressable>
      {showAdvancedFilters ? (
        <View style={styles.inputRow}>
          <TextInput
            autoCapitalize="none"
            onChangeText={(text) => update({ deviceId: text })}
            placeholder={t("iot.alerts.filters.manualDeviceIdentifier")}
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={deviceId}
          />
          <TextInput
            autoCapitalize="none"
            onChangeText={(text) => update({ zoneId: text })}
            placeholder={t("iot.alerts.filters.manualZoneIdentifier")}
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={zoneId}
          />
        </View>
      ) : null}
    </View>
  );
}

function SelectDropdown<T extends string>({
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
  const [open, setOpen] = useState(false);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.dropdown,
          pressed && styles.dropdownPressed,
        ]}
      >
        <View style={styles.dropdownTextWrap}>
          <Text style={styles.dropdownTitle}>{label}</Text>
          <Text numberOfLines={1} style={styles.dropdownLabel}>
            {selectedOption?.label}
          </Text>
        </View>
        <View style={styles.dropdownIcon}>
          <ChevronDown color="#ffffff" size={20} />
        </View>
      </Pressable>
      <PickerModal
        visible={open}
        title={label}
        items={options}
        selectedId={value ?? "__all__"}
        keyExtractor={(option) => option.value ?? "__all__"}
        labelExtractor={(option) => option.label}
        searchFields={[(option) => option.label]}
        onClose={() => setOpen(false)}
        onSelect={(nextValue) => {
          onSelect(nextValue === "__all__" ? undefined : (nextValue as T));
          setOpen(false);
        }}
        renderItem={(option) => {
          const selected = option.value === value;
          return (
            <Pressable
              onPress={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text
                style={[
                  styles.optionLabel,
                  selected && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              {selected ? (
                <View style={styles.checkBadge}>
                  <Check color="#ffffff" size={14} />
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  advancedButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  advancedButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: "#16a34a",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  dropdown: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#14532d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownIcon: {
    alignItems: "center",
    backgroundColor: "#16a34a",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  dropdownLabel: {
    color: "#0f172a",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  dropdownPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  dropdownTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  dropdownTitle: {
    color: "#15803d",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
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
  option: {
    alignItems: "center",
    borderBottomColor: "rgba(148, 163, 184, 0.18)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  optionLabel: {
    color: "#0f172a",
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  optionLabelSelected: {
    color: "#166534",
  },
  optionSelected: {
    backgroundColor: "#f0fdf4",
  },
  title: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
});
