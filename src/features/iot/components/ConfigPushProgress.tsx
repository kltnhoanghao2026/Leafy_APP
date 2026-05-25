import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type PushState = "idle" | "sending" | "waiting" | "acked" | "failed" | "timeout";

type ConfigPushProgressProps = {
  state: PushState;
  error?: string | null;
};

const messageKeys: Record<PushState, string> = {
  idle: "iot.config.pushProgress.idle",
  sending: "iot.config.pushProgress.sending",
  waiting: "iot.config.pushProgress.waiting",
  acked: "iot.config.pushProgress.acked",
  failed: "iot.config.pushProgress.failed",
  timeout: "iot.config.pushProgress.timeout",
};

export function ConfigPushProgress({ state, error }: ConfigPushProgressProps) {
  const { t } = useTranslation();

  if (state === "idle") {
    return null;
  }

  const isLoading = state === "sending" || state === "waiting";
  const isError = state === "failed" || state === "timeout";

  return (
    <View style={[styles.card, isError && styles.errorCard]}>
      {isLoading ? <ActivityIndicator color="#15803d" /> : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, isError && styles.errorTitle]}>{t(messageKeys[state])}</Text>
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
