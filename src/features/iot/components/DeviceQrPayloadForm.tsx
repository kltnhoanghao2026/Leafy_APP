import { StyleSheet, Text, TextInput, View } from "react-native";

import type { DeviceQrPayload } from "../types";

type DeviceQrPayloadFormProps = {
  value: Partial<DeviceQrPayload>;
  onChange: (value: Partial<DeviceQrPayload>) => void;
};

export function DeviceQrPayloadForm({ value, onChange }: DeviceQrPayloadFormProps) {
  const update = (field: keyof DeviceQrPayload, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nhập thủ công thông tin thiết bị</Text>
      <Field
        label="Device UID"
        onChangeText={(text) => update("deviceUid", text)}
        placeholder="LEAFY-ESP32-001"
        value={value.deviceUid ?? ""}
      />
      <Field
        label="Device code"
        onChangeText={(text) => update("deviceCode", text)}
        placeholder="ESP32-001"
        value={value.deviceCode ?? ""}
      />
      <Field
        label="Device type"
        onChangeText={(text) => update("deviceType", text)}
        placeholder="ESP32_CAM_SENSOR"
        value={value.deviceType ?? ""}
      />
      <Field
        label="Model"
        onChangeText={(text) => update("model", text)}
        placeholder="Leafy IoT Module V1"
        value={value.model ?? ""}
      />
    </View>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  field: {
    gap: 6,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 12,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
});
