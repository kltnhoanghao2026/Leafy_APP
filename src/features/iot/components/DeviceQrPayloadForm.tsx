import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { DeviceQrPayload } from "../types";

type DeviceQrPayloadFormProps = {
  value: Partial<DeviceQrPayload>;
  onChange: (value: Partial<DeviceQrPayload>) => void;
};

export function DeviceQrPayloadForm({ value, onChange }: DeviceQrPayloadFormProps) {
  const { t } = useTranslation();

  const update = (field: keyof DeviceQrPayload, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("iot.devices.onboarding.manualInfoTitle")}</Text>
      <Text style={styles.hint}>{t("iot.devices.onboarding.technicalDeviceInfo")}</Text>
      <Field
        label={t("iot.devices.onboarding.deviceIdentifier")}
        onChangeText={(text) => update("deviceUid", text)}
        placeholder={t("iot.devices.onboarding.deviceIdentifierPlaceholder")}
        value={value.deviceUid ?? ""}
      />
      <Field
        label={t("iot.devices.onboarding.deviceCode")}
        onChangeText={(text) => update("deviceCode", text)}
        placeholder={t("iot.devices.onboarding.deviceCodePlaceholder")}
        value={value.deviceCode ?? ""}
      />
      <Field
        label={t("iot.devices.onboarding.deviceType")}
        onChangeText={(text) => update("deviceType", text)}
        placeholder={t("iot.devices.onboarding.deviceTypePlaceholder")}
        value={value.deviceType ?? ""}
      />
      <Field
        label={t("iot.devices.onboarding.model")}
        onChangeText={(text) => update("model", text)}
        placeholder={t("iot.devices.onboarding.modelPlaceholder")}
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
  hint: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
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
