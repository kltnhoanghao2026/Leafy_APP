import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

export type DevicePickerOption = {
  id?: string;
  deviceId?: string;
  deviceUid?: string | null;
  deviceCode?: string | null;
  name?: string | null;
  deviceName?: string | null;
  display?: {
    deviceLabel?: string;
    nameLabel?: string;
    technical?: {
      deviceId?: string;
      deviceUid?: string;
    };
  };
};

export type PickedDevice = {
  id?: string;
  deviceId?: string;
  deviceUid?: string | null;
  label: string;
};

type DevicePickerProps = {
  label?: string;
  value?: string | null;
  devices: DevicePickerOption[];
  onChange: (device: PickedDevice | null) => void;
  mode?: "deviceId" | "deviceUid";
  placeholder?: string;
  allowClear?: boolean;
  showAdvancedManualInput?: boolean;
  manualValue?: string;
  onManualChange?: (value: string) => void;
};

const getDeviceLabel = (
  device: DevicePickerOption,
  fallback: string,
) =>
  device.display?.nameLabel ??
  device.display?.deviceLabel ??
  device.deviceName ??
  device.name ??
  device.deviceCode ??
  fallback;

const getDeviceKey = (device: DevicePickerOption, mode: "deviceId" | "deviceUid") =>
  mode === "deviceUid"
    ? device.deviceUid ?? device.display?.technical?.deviceUid ?? ""
    : device.id ?? device.deviceId ?? device.display?.technical?.deviceId ?? "";

export function DevicePicker({
  label,
  value,
  devices,
  onChange,
  mode = "deviceId",
  placeholder,
  allowClear = true,
  showAdvancedManualInput = false,
  manualValue,
  onManualChange,
}: DevicePickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const fallbackLabel = t("iot.common.unknownDevice");

  const selectedDevice = useMemo(
    () => devices.find((device) => getDeviceKey(device, mode) === value),
    [devices, mode, value],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredDevices = useMemo(() => {
    if (!normalizedQuery) return devices;

    return devices.filter((device) => {
      const searchValue = [
        getDeviceLabel(device, fallbackLabel),
        device.deviceCode,
        device.deviceUid,
        device.id,
        device.deviceId,
        device.display?.technical?.deviceUid,
        device.display?.technical?.deviceId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchValue.includes(normalizedQuery);
    });
  }, [devices, fallbackLabel, normalizedQuery]);

  const selectDevice = (device: DevicePickerOption) => {
    onChange({
      id: device.id,
      deviceId: device.deviceId ?? device.id ?? device.display?.technical?.deviceId,
      deviceUid: device.deviceUid ?? device.display?.technical?.deviceUid,
      label: getDeviceLabel(device, fallbackLabel),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label ?? t("iot.common.selectDevice")}</Text>
      <TextInput
        autoCapitalize="none"
        onChangeText={setQuery}
        placeholder={placeholder ?? t("iot.common.searchDevice")}
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={query}
      />
      {selectedDevice ? (
        <View style={styles.selectedRow}>
          <View style={styles.selectedTextWrap}>
            <Text style={styles.selectedLabel}>
              {getDeviceLabel(selectedDevice, fallbackLabel)}
            </Text>
            {selectedDevice.deviceCode &&
            selectedDevice.deviceCode !== getDeviceLabel(selectedDevice, fallbackLabel) ? (
              <Text style={styles.secondaryText}>{selectedDevice.deviceCode}</Text>
            ) : null}
          </View>
          {allowClear ? (
            <Pressable style={styles.clearButton} onPress={() => onChange(null)}>
              <Text style={styles.clearText}>{t("iot.common.clearSelection")}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.optionList}>
        {filteredDevices.length === 0 ? (
          <Text style={styles.emptyText}>{t("iot.common.noDevicesFound")}</Text>
        ) : (
          filteredDevices.slice(0, 8).map((device) => {
            const key = getDeviceKey(device, mode) || device.id || device.deviceUid || getDeviceLabel(device, fallbackLabel);
            const selected = key === value;
            const deviceLabel = getDeviceLabel(device, fallbackLabel);

            return (
              <Pressable
                key={key}
                onPress={() => selectDevice(device)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {deviceLabel}
                </Text>
                {device.deviceCode && device.deviceCode !== deviceLabel ? (
                  <Text style={styles.secondaryText}>{device.deviceCode}</Text>
                ) : null}
              </Pressable>
            );
          })
        )}
      </View>
      {showAdvancedManualInput ? (
        <View style={styles.advancedBox}>
          <Text style={styles.advancedLabel}>{t("iot.common.advancedManualInput")}</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={onManualChange}
            placeholder={t("iot.cameraSchedules.manualDeviceIdentifier")}
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={manualValue}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  advancedBox: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  advancedLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
  },
  clearButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  clearText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  container: {
    gap: 8,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 14,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  option: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  optionLabel: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900",
  },
  optionLabelSelected: {
    color: "#166534",
  },
  optionList: {
    gap: 8,
  },
  optionSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  secondaryText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  selectedLabel: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },
  selectedRow: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 10,
  },
  selectedTextWrap: {
    flex: 1,
  },
});
