import { Edit3, LogOut, X } from "lucide-react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type DeviceActionsSheetProps = {
  visible: boolean;
  deviceLabel: string;
  onEdit: () => void;
  onRelease: () => void;
  onClose: () => void;
};

export function DeviceActionsSheet({
  visible,
  deviceLabel,
  onEdit,
  onRelease,
  onClose,
}: DeviceActionsSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityRole="button" style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t("iot.devices.actions.more")}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {deviceLabel || t("iot.common.selectedDevice")}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={t("common.cancel")}
              hitSlop={8}
              onPress={onClose}
              style={styles.iconButton}
            >
              <X color="#64748b" size={20} />
            </Pressable>
          </View>

          <Pressable style={styles.action} onPress={onEdit}>
            <Edit3 color="#166534" size={20} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{t("iot.devices.actions.edit")}</Text>
              <Text style={styles.actionSubtitle}>
                {t("iot.devices.actions.changeLocation")}
              </Text>
            </View>
          </Pressable>

          <Pressable style={[styles.action, styles.dangerAction]} onPress={onRelease}>
            <LogOut color="#be123c" size={20} />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, styles.dangerText]}>
                {t("iot.devices.actions.release")}
              </Text>
              <Text style={styles.actionSubtitle}>
                {t("iot.devices.release.shortDescription")}
              </Text>
            </View>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  actionSubtitle: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
  },
  backdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  cancelButton: {
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
  },
  cancelText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "900",
  },
  dangerAction: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
  },
  dangerText: {
    color: "#be123c",
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
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    gap: 10,
    padding: 18,
    paddingBottom: 28,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  title: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
});
