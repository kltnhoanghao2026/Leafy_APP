import { Text, View } from "react-native";

type StatusBadgeVariant =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "violet"
  | "neutral";

type StatusBadgeProps = {
  label: string;
  variant?: StatusBadgeVariant;
  /** Custom Tailwind bg + text classes (overrides variant) */
  bgClassName?: string;
  textClassName?: string;
};

const VARIANT_STYLES: Record<StatusBadgeVariant, { bg: string; text: string }> =
  {
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-600 dark:text-amber-400",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
    },
    danger: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-600 dark:text-red-400",
    },
    violet: {
      bg: "bg-violet-50 dark:bg-violet-900/20",
      text: "text-violet-600 dark:text-violet-400",
    },
    neutral: {
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-600 dark:text-slate-400",
    },
  };

export function StatusBadge({
  label,
  variant = "success",
  bgClassName,
  textClassName,
}: StatusBadgeProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <View
      className={`self-start rounded-lg px-2.5 py-1 ${bgClassName ?? styles.bg}`}
    >
      <Text
        className={`text-[11px] font-extrabold ${textClassName ?? styles.text}`}
      >
        {label}
      </Text>
    </View>
  );
}
