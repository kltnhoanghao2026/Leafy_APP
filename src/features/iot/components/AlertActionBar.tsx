import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AlertStatus } from "../types";

type AlertActionBarProps = {
  status?: AlertStatus | null;
  acknowledging?: boolean;
  resolving?: boolean;
  onAcknowledge: () => void;
  onResolve: () => void;
};

export function AlertActionBar({
  status,
  acknowledging,
  resolving,
  onAcknowledge,
  onResolve,
}: AlertActionBarProps) {
  const canAcknowledge = status === "OPEN";
  const canResolve = status === "OPEN" || status === "ACKNOWLEDGED";

  if (status === "RESOLVED" || status === "CLOSED") {
    return (
      <View style={styles.resolvedBox}>
        <Text style={styles.resolvedText}>Canh bao da duoc xu ly.</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        disabled={!canAcknowledge || acknowledging || resolving}
        onPress={onAcknowledge}
        style={[
          styles.secondaryButton,
          (!canAcknowledge || acknowledging || resolving) && styles.disabled,
        ]}
      >
        <Text style={styles.secondaryText}>
          {acknowledging ? "Dang xac nhan..." : "Xac nhan da xem"}
        </Text>
      </Pressable>
      <Pressable
        disabled={!canResolve || acknowledging || resolving}
        onPress={onResolve}
        style={[
          styles.primaryButton,
          (!canResolve || acknowledging || resolving) && styles.disabled,
        ]}
      >
        <Text style={styles.primaryText}>
          {resolving ? "Dang xu ly..." : "Danh dau da xu ly"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#15803d",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 13,
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  resolvedBox: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  resolvedText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "900",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    borderColor: "#bae6fd",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  secondaryText: {
    color: "#0369a1",
    fontSize: 13,
    fontWeight: "900",
  },
});
