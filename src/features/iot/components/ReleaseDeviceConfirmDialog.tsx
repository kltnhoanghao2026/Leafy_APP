import { AlertTriangle } from "lucide-react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type ReleaseDeviceConfirmDialogProps = {
  visible: boolean;
  deviceLabel?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  isSubmitting?: boolean;
};

export function ReleaseDeviceConfirmDialog({
  visible,
  deviceLabel,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: ReleaseDeviceConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.iconWrap}>
            <AlertTriangle color="#be123c" size={26} />
          </View>
          <Text style={styles.title}>{t("iot.devices.release.title")}</Text>
          {deviceLabel ? (
            <Text style={styles.deviceLabel} numberOfLines={1}>
              {deviceLabel}
            </Text>
          ) : null}
          <Text style={styles.message}>{t("iot.devices.release.message")}</Text>

          <View style={styles.actions}>
            <Pressable
              disabled={isSubmitting}
              onPress={onCancel}
              style={[styles.button, styles.cancelButton, isSubmitting && styles.disabled]}
            >
              <Text style={styles.cancelText}>{t("iot.devices.release.cancel")}</Text>
            </Pressable>
            <Pressable
              disabled={isSubmitting}
              onPress={() => void onConfirm()}
              style={[styles.button, styles.releaseButton, isSubmitting && styles.disabled]}
            >
              <Text style={styles.releaseText}>
                {isSubmitting
                  ? t("iot.devices.release.releasing")
                  : t("iot.devices.release.confirm")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  button: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "900",
  },
  deviceLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  dialog: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    width: "100%",
  },
  disabled: {
    opacity: 0.55,
  },
  iconWrap: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#fff1f2",
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    marginBottom: 12,
    width: 54,
  },
  message: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
    textAlign: "center",
  },
  releaseButton: {
    backgroundColor: "#be123c",
  },
  releaseText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  title: {
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },
});
