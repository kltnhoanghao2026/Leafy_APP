import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { ConfigFormValues } from "../utils/configValidation";
import { validateConfigForm } from "../utils/configValidation";

type ConfigFormProps = {
  value: ConfigFormValues;
  disabled?: boolean;
  onChange: (value: ConfigFormValues) => void;
  onSubmit: () => void;
  changed: boolean;
  saving?: boolean;
};

export function ConfigForm({
  value,
  disabled,
  onChange,
  onSubmit,
  changed,
  saving,
}: ConfigFormProps) {
  const { t } = useTranslation();
  const validation = validateConfigForm(value);
  const canSave = !disabled && changed && validation.ok && !saving;

  const update = (field: keyof ConfigFormValues, fieldValue: string | boolean) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("iot.config.formTitle")}</Text>
      <NumericField
        disabled={disabled}
        label={t("iot.config.samplingInterval")}
        onChangeText={(text) => update("samplingIntervalSec", text)}
        suffix={t("iot.config.seconds")}
        value={value.samplingIntervalSec}
      />
      <NumericField
        disabled={disabled}
        label={t("iot.config.publishInterval")}
        onChangeText={(text) => update("publishIntervalSec", text)}
        suffix={t("iot.config.seconds")}
        value={value.publishIntervalSec}
      />
      <NumericField
        disabled={disabled}
        label={t("iot.config.offlineTimeout")}
        onChangeText={(text) => update("offlineTimeoutSec", text)}
        suffix={t("iot.config.seconds")}
        value={value.offlineTimeoutSec}
      />
      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.label}>{t("iot.config.alertEnabled")}</Text>
          <Text style={styles.hint}>{t("iot.config.alertEnabledHint")}</Text>
        </View>
        <Switch
          disabled={disabled}
          onValueChange={(nextValue) => update("alertEnabled", nextValue)}
          value={value.alertEnabled}
        />
      </View>

      {!validation.ok ? (
        <View style={styles.errorBox}>
          {validation.errors.map((error) => (
            <Text key={error} style={styles.errorText}>
              {t(error)}
            </Text>
          ))}
        </View>
      ) : null}

      <Pressable
        disabled={!canSave}
        onPress={onSubmit}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
      >
        <Text style={styles.saveButtonText}>
          {saving ? t("iot.config.saving") : t("iot.config.save")}
        </Text>
      </Pressable>
    </View>
  );
}

function NumericField({
  label,
  value,
  suffix,
  disabled,
  onChangeText,
}: {
  label: string;
  value: string;
  suffix: string;
  disabled?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          editable={!disabled}
          keyboardType="number-pad"
          onChangeText={onChangeText}
          style={[styles.input, disabled && styles.inputDisabled]}
          value={value}
        />
        <Text style={styles.suffix}>{suffix}</Text>
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
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  errorText: {
    color: "#be123c",
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: 6,
  },
  hint: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 12,
    borderWidth: 1,
    color: "#0f172a",
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputDisabled: {
    color: "#94a3b8",
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#15803d",
    borderRadius: 999,
    paddingVertical: 13,
  },
  saveButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  suffix: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "800",
    width: 42,
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  switchText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
});
