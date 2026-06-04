import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, ChevronRight } from "lucide-react-native";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

export type IoTTone =
  | "neutral"
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "danger";

const statusTones: Record<IoTTone, { bg: string; border: string; text: string }> = {
  neutral: { bg: "#F1F5F9", border: "#E2E8F0", text: "#475569" },
  primary: { bg: "#DCFCE7", border: "#BBF7D0", text: "#166534" },
  success: { bg: "#DCFCE7", border: "#86EFAC", text: "#166534" },
  info: { bg: "#E0F2FE", border: "#BAE6FD", text: "#0369A1" },
  warning: { bg: "#FEF3C7", border: "#FDE68A", text: "#92400E" },
  danger: { bg: "#FEE2E2", border: "#FECACA", text: "#991B1B" },
};

const statusTonesDark: Record<IoTTone, { bg: string; border: string; text: string }> = {
  neutral: { bg: "#1E293B", border: "#334155", text: "#CBD5E1" },
  primary: { bg: "#123524", border: "#236B43", text: "#86EFAC" },
  success: { bg: "#123524", border: "#236B43", text: "#86EFAC" },
  info: { bg: "#0C2D48", border: "#075985", text: "#7DD3FC" },
  warning: { bg: "#3B2F12", border: "#A16207", text: "#FDE68A" },
  danger: { bg: "#3F1519", border: "#991B1B", text: "#FCA5A5" },
};

export const mediaStatusTone = (status?: string | null): IoTTone => {
  const normalized = status?.toUpperCase();
  if (normalized === "UPLOADED" || normalized === "PROCESSED" || normalized === "DISEASE_DETECTED") {
    return "success";
  }
  if (normalized === "PROCESSING" || normalized === "PENDING" || normalized === "COMMAND_SENT" || normalized === "UPLOADING") {
    return "warning";
  }
  if (normalized === "FAILED" || normalized === "TIMEOUT") {
    return "danger";
  }
  if (normalized === "REQUESTED") {
    return "info";
  }
  return "neutral";
};

export const deviceStatusTone = (status?: string | null): IoTTone => {
  const normalized = status?.toUpperCase();
  if (normalized === "ONLINE" || normalized === "ACTIVE") return "success";
  if (normalized === "WARNING" || normalized === "MAINTENANCE" || normalized === "PENDING") return "warning";
  if (normalized === "ERROR" || normalized === "CRITICAL" || normalized === "FAILED") return "danger";
  return "neutral";
};

export function useIotTheme() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const isDark = scheme === "dark";

  return {
    scheme,
    isDark,
    text: palette.text,
    muted: palette.textGray,
    subtle: isDark ? "#CBD5E1" : "#475569",
    background: palette.background,
    card: isDark ? "#1E293B" : "#FFFFFF",
    cardAlt: isDark ? "#0F172A" : "#F8FAFC",
    border: isDark ? "#334155" : "#E2E8F0",
    borderStrong: isDark ? "#475569" : "#CBD5E1",
    primary: palette.primary,
    primaryText: isDark ? "#052E16" : "#FFFFFF",
    primarySoft: isDark ? "#123524" : "#DCFCE7",
    danger: isDark ? "#FCA5A5" : "#B91C1C",
    dangerSoft: isDark ? "#3F1519" : "#FEE2E2",
    warning: isDark ? "#FDE68A" : "#92400E",
    warningSoft: isDark ? "#3B2F12" : "#FEF3C7",
    shadow: isDark ? "#000000" : "#0F172A",
    tone: (tone: IoTTone = "neutral") => (isDark ? statusTonesDark : statusTones)[tone],
  };
}

export function IoTStatusBadge({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: IoTTone;
  icon?: ReactNode;
}) {
  const theme = useIotTheme();
  const colors = theme.tone(tone);

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {icon}
      <Text numberOfLines={1} style={[styles.badgeText, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

export function IoTActionCard({
  icon,
  title,
  description,
  onPress,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const theme = useIotTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          opacity: disabled ? 0.58 : 1,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: theme.primarySoft }]}>{icon}</View>
      <View style={styles.actionText}>
        <Text numberOfLines={1} style={[styles.actionTitle, { color: theme.text }]}>
          {title}
        </Text>
        <Text numberOfLines={2} style={[styles.actionDescription, { color: theme.subtle }]}>
          {description}
        </Text>
      </View>
      <ChevronRight color={theme.primary} size={20} />
    </Pressable>
  );
}

export function IoTFilterPill({
  label,
  value,
  onPress,
  selected,
}: {
  label?: string;
  value: string;
  onPress?: () => void;
  selected?: boolean;
}) {
  const theme = useIotTheme();
  const tone = theme.tone(selected ? "primary" : "neutral");

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterPill,
        { backgroundColor: selected ? tone.bg : theme.cardAlt, borderColor: selected ? tone.border : theme.border },
        pressed && styles.pressed,
      ]}
    >
      {label ? <Text style={[styles.filterLabel, { color: selected ? tone.text : theme.muted }]}>{label}</Text> : null}
      <Text numberOfLines={1} style={[styles.filterValue, { color: selected ? tone.text : theme.text }]}>
        {value}
      </Text>
      <ChevronDown color={selected ? tone.text : theme.primary} size={16} />
    </Pressable>
  );
}

export function IoTButton({
  label,
  icon,
  onPress,
  loading,
  disabled,
  tone = "primary",
}: {
  label: string;
  icon?: ReactNode;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger";
}) {
  const theme = useIotTheme();
  const isDanger = tone === "danger";
  const isSecondary = tone === "secondary";
  const backgroundColor = isDanger
    ? theme.dangerSoft
    : isSecondary
      ? theme.primarySoft
      : theme.primary;
  const borderColor = isDanger
    ? theme.tone("danger").border
    : isSecondary
      ? theme.tone("primary").border
      : theme.primary;
  const color = isDanger ? theme.danger : isSecondary ? theme.primary : theme.primaryText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: disabled || loading ? 0.58 : 1,
        },
        pressed && !(disabled || loading) && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color={color} size="small" /> : icon}
      <Text numberOfLines={1} style={[styles.buttonText, { color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IoTEmptyCard({ title, description }: { title: string; description?: string }) {
  const theme = useIotTheme();

  return (
    <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {description ? <Text style={[styles.emptyText, { color: theme.subtle }]}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    padding: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  actionIcon: {
    alignItems: "center",
    borderRadius: 13,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  actionText: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    maxWidth: "100%",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  button: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  filterPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterValue: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
