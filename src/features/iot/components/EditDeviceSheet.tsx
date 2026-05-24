import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import type {
  DeviceDetailResponse,
  DeviceResponse,
  UpdateDeviceRequest,
} from "../types";
import { FarmZonePicker, type FarmZoneSelection } from "./FarmZonePicker";

type EditableDevice = DeviceResponse | DeviceDetailResponse;

type EditDeviceSheetProps = {
  visible: boolean;
  device: EditableDevice | null;
  onClose: () => void;
  onSubmit: (payload: UpdateDeviceRequest) => Promise<void> | void;
  isSubmitting?: boolean;
};

const DEVICE_NAME_MAX_LENGTH = 100;

const normalize = (value?: string | null) => value?.trim() ?? "";

export function EditDeviceSheet({
  visible,
  device,
  onClose,
  onSubmit,
  isSubmitting = false,
}: EditDeviceSheetProps) {
  const { t } = useTranslation();
  const [deviceName, setDeviceName] = useState("");
  const [location, setLocation] = useState<FarmZoneSelection>({});
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !device) return;

    setDeviceName(device.deviceName ?? "");
    setLocation({
      farmPlotId: device.farmPlotId ?? undefined,
      zoneId: device.zoneId ?? undefined,
    });
    setActive(device.isActive ?? true);
    setError(null);
  }, [device, visible]);

  const original = useMemo(
    () => ({
      deviceName: normalize(device?.deviceName),
      farmPlotId: device?.farmPlotId ?? "",
      zoneId: device?.zoneId ?? "",
      active: device?.isActive ?? true,
    }),
    [device],
  );

  const trimmedName = deviceName.trim();
  const payload = useMemo<UpdateDeviceRequest>(() => {
    const nextPayload: UpdateDeviceRequest = {};
    if (trimmedName !== original.deviceName) nextPayload.deviceName = trimmedName;
    if ((location.farmPlotId ?? "") !== original.farmPlotId) {
      nextPayload.farmPlotId = location.farmPlotId;
    }
    if ((location.zoneId ?? "") !== original.zoneId) {
      nextPayload.zoneId = location.zoneId;
    }
    if (active !== original.active) nextPayload.active = active;
    return nextPayload;
  }, [active, location.farmPlotId, location.zoneId, original, trimmedName]);

  const hasChanges = Object.keys(payload).length > 0;

  const validate = () => {
    if (!trimmedName) return t("iot.devices.edit.nameRequired");
    if (trimmedName.length > DEVICE_NAME_MAX_LENGTH) {
      return t("iot.devices.edit.nameTooLong", { max: DEVICE_NAME_MAX_LENGTH });
    }
    if (location.zoneId && !location.farmPlotId) {
      return t("iot.devices.edit.zoneRequiresFarm");
    }
    if (!hasChanges) return t("iot.devices.edit.noChanges");
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    try {
      await onSubmit(payload);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("iot.devices.edit.error");
      setError(message || t("iot.devices.edit.error"));
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t("iot.devices.edit.title")}</Text>
              <Text style={styles.subtitle}>{t("iot.devices.edit.description")}</Text>
            </View>
            <Pressable
              disabled={isSubmitting}
              onPress={onClose}
              style={[styles.cancelPill, isSubmitting && styles.disabled]}
            >
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.field}>
              <Text style={styles.label}>{t("iot.devices.edit.deviceName")}</Text>
              <TextInput
                maxLength={DEVICE_NAME_MAX_LENGTH}
                onChangeText={setDeviceName}
                placeholder={t("iot.devices.edit.deviceNamePlaceholder")}
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={deviceName}
              />
            </View>

            <FarmZonePicker
              onChange={setLocation}
              title={t("iot.devices.actions.changeLocation")}
              value={location}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>{t("iot.devices.edit.active")}</Text>
                <Text style={styles.switchSubtitle}>
                  {t("iot.devices.edit.activeDescription")}
                </Text>
              </View>
              <Switch
                disabled={isSubmitting}
                onValueChange={setActive}
                thumbColor={active ? "#ffffff" : "#f8fafc"}
                trackColor={{ false: "#cbd5e1", true: "#15803d" }}
                value={active}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              disabled={isSubmitting || !hasChanges}
              onPress={handleSubmit}
              style={[styles.saveButton, (isSubmitting || !hasChanges) && styles.disabled]}
            >
              <Text style={styles.saveText}>
                {isSubmitting ? t("iot.devices.edit.saving") : t("iot.devices.edit.save")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  cancelPill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  content: {
    gap: 16,
    paddingBottom: 14,
  },
  disabled: {
    opacity: 0.55,
  },
  error: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 14,
    borderWidth: 1,
    color: "#be123c",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    padding: 12,
  },
  field: {
    gap: 8,
  },
  footer: {
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    paddingTop: 14,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#cbd5e1",
    borderRadius: 999,
    height: 4,
    marginBottom: 12,
    width: 44,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 14,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#15803d",
    borderRadius: 16,
    padding: 14,
  },
  saveText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "92%",
    padding: 18,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  switchRow: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  switchSubtitle: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  switchText: {
    flex: 1,
  },
  switchTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  title: {
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "900",
  },
});
