import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type PushState = "idle" | "sending" | "waiting" | "acked" | "failed" | "timeout";

type ConfigPushProgressProps = {
  state: PushState;
  error?: string | null;
};

const messages: Record<PushState, string> = {
  idle: "",
  sending: "Dang gui cau hinh...",
  waiting: "Dang cho thiet bi xac nhan...",
  acked: "Thiet bi da xac nhan cau hinh.",
  failed: "Thiet bi bao loi khi ap dung cau hinh.",
  timeout: "Qua thoi gian cho ACK.",
};

export function ConfigPushProgress({ state, error }: ConfigPushProgressProps) {
  if (state === "idle") {
    return null;
  }

  const isLoading = state === "sending" || state === "waiting";
  const isError = state === "failed" || state === "timeout";

  return (
    <View style={[styles.card, isError && styles.errorCard]}>
      {isLoading ? <ActivityIndicator color="#15803d" /> : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, isError && styles.errorTitle]}>{messages[state]}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
  },
  errorText: {
    color: "#be123c",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  errorTitle: {
    color: "#be123c",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "900",
  },
});
