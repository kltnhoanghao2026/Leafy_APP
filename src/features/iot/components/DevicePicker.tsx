import { Check, ChevronDown, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PickerModal } from "@/src/components/ui/PickerModal";

export type DevicePickerOption = {
  id?: string;
  deviceId?: string | null;
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

const getDeviceLabel = (device: DevicePickerOption, fallback: string) =>
  device.display?.nameLabel ??
  device.display?.deviceLabel ??
  device.deviceName ??
  device.name ??
  device.deviceCode ??
  fallback;

const getDeviceKey = (
  device: DevicePickerOption,
  mode: "deviceId" | "deviceUid",
) =>
  mode === "deviceUid"
    ? (device.deviceUid ?? device.display?.technical?.deviceUid ?? "")
    : (device.id ??
      device.deviceId ??
      device.display?.technical?.deviceId ??
      "");

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
  const [open, setOpen] = useState(false);
  const fallbackLabel = t("iot.common.unknownDevice");

  const selectedDevice = useMemo(
    () => devices.find((device) => getDeviceKey(device, mode) === value),
    [devices, mode, value],
  );
  const selectedLabel = selectedDevice
    ? getDeviceLabel(selectedDevice, fallbackLabel)
    : (placeholder ?? t("iot.common.searchDevice"));

  const selectDevice = (device: DevicePickerOption) => {
    onChange({
      id: device.id,
      deviceId:
        device.deviceId ?? device.id ?? device.display?.technical?.deviceId,
      deviceUid: device.deviceUid ?? device.display?.technical?.deviceUid,
      label: getDeviceLabel(device, fallbackLabel),
    });
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label ?? t("iot.common.selectDevice")}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.dropdown,
          pressed && styles.dropdownPressed,
        ]}
      >
        <View style={styles.textWrap}>
          <Text
            numberOfLines={1}
            style={[
              styles.dropdownLabel,
              !selectedDevice && styles.dropdownPlaceholder,
            ]}
          >
            {selectedLabel}
          </Text>
          {selectedDevice?.deviceCode &&
          selectedDevice.deviceCode !== selectedLabel ? (
            <Text style={styles.dropdownMeta}>{selectedDevice.deviceCode}</Text>
          ) : null}
        </View>
        {selectedDevice && allowClear ? (
          <Pressable
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onChange(null);
            }}
            style={styles.clearIconButton}
          >
            <X color="#166534" size={16} />
          </Pressable>
        ) : null}
        <View style={styles.dropdownIcon}>
          <ChevronDown color="#ffffff" size={20} />
        </View>
      </Pressable>
      <PickerModal
        visible={open}
        title={label ?? t("iot.common.selectDevice")}
        items={devices}
        selectedId={value ?? undefined}
        searchPlaceholder={placeholder ?? t("iot.common.searchDevice")}
        emptyText={t("iot.common.noDevicesFound")}
        keyExtractor={(device) =>
          getDeviceKey(device, mode) ||
          device.id ||
          device.deviceUid ||
          getDeviceLabel(device, fallbackLabel)
        }
        labelExtractor={(device) => getDeviceLabel(device, fallbackLabel)}
        subtitleExtractor={(device) =>
          device.deviceCode ?? device.deviceUid ?? device.id
        }
        searchFields={[
          (device) => getDeviceLabel(device, fallbackLabel),
          (device) => device.deviceCode ?? undefined,
          (device) => device.deviceUid ?? undefined,
          (device) => device.id,
          (device) => device.deviceId ?? undefined,
          (device) => device.display?.technical?.deviceUid,
          (device) => device.display?.technical?.deviceId,
        ]}
        onClose={() => setOpen(false)}
        onSelect={(id) => {
          const device = devices.find((item) => {
            const key =
              getDeviceKey(item, mode) ||
              item.id ||
              item.deviceUid ||
              getDeviceLabel(item, fallbackLabel);
            return key === id;
          });
          if (device) selectDevice(device);
        }}
        renderItem={(device, selected) => {
          const deviceLabel = getDeviceLabel(device, fallbackLabel);
          return (
            <Pressable
              onPress={() => selectDevice(device)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={styles.textWrap}>
                <Text
                  style={[
                    styles.optionLabel,
                    selected && styles.optionLabelSelected,
                  ]}
                >
                  {deviceLabel}
                </Text>
                {device.deviceCode && device.deviceCode !== deviceLabel ? (
                  <Text style={styles.secondaryText}>{device.deviceCode}</Text>
                ) : null}
              </View>
              {selected ? (
                <View style={styles.checkBadge}>
                  <Check color="#ffffff" size={14} />
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
      {showAdvancedManualInput ? (
        <View style={styles.advancedBox}>
          <Text style={styles.advancedLabel}>
            {t("iot.common.advancedManualInput")}
          </Text>
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
  checkBadge: {
    alignItems: "center",
    backgroundColor: "#16a34a",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  clearIconButton: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  container: {
    gap: 8,
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
  },
  dropdownMeta: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  dropdownPlaceholder: {
    color: "#64748b",
  },
  dropdownPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
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
    fontSize: 14,
    fontWeight: "900",
  },
  optionLabelSelected: {
    color: "#166534",
  },
  optionSelected: {
    backgroundColor: "#f0fdf4",
  },
  secondaryText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
});
