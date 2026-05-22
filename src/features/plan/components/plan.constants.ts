import {
  CheckCircle2,
  CircleDashed,
  Loader,
  Play,
  XCircle,
} from "lucide-react-native";

import type { PlanSourceType, PlanStatus } from "../schemas/plan.schema";

// ── Status chip filter configs (PlanScreen) ──────────────────────────────────

export const STATUS_CHIP_CONFIG: Array<{
  value: PlanStatus | "";
  labelKey: string;
}> = [
  { value: "", labelKey: "plan.filter.statusAll" },
  { value: "PENDING", labelKey: "plan.status.PENDING" },
  { value: "APPLYING", labelKey: "plan.status.APPLYING" },
  { value: "ACTIVE", labelKey: "plan.status.ACTIVE" },
  { value: "COMPLETED", labelKey: "plan.status.COMPLETED" },
  { value: "CANCELLED", labelKey: "plan.status.CANCELLED" },
];

export const SOURCE_TYPE_CHIPS: Array<{ value: PlanSourceType | ""; labelKey: string }> = [
  { value: "", labelKey: "plan.filter.sourceAll" },
  { value: "USER_CREATED", labelKey: "plan.filter.sourceUserCreated" },
  { value: "RAG_GEN", labelKey: "plan.filter.sourceRagGen" },
  { value: "CONSULTED", labelKey: "plan.filter.sourceConsulted" },
];

// ── Status badge configs (PlanScreen, PlanApplyCard) ──────────────────────────

export type StatusConfig = {
  labelKey: string;
  bg: string;
  text: string;
  icon: any;
};

export const STATUS_TAB_CONFIG: Record<PlanStatus, StatusConfig> = {
  PENDING: {
    labelKey: "plan.status.PENDING",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: CircleDashed,
  },
  APPLYING: {
    labelKey: "plan.status.APPLYING",
    bg: "bg-purple-50",
    text: "text-purple-700",
    icon: Loader,
  },
  ACTIVE: {
    labelKey: "plan.status.ACTIVE",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: Play,
  },
  COMPLETED: {
    labelKey: "plan.status.COMPLETED",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: CheckCircle2,
  },
  CANCELLED: {
    labelKey: "plan.status.CANCELLED",
    bg: "bg-slate-100",
    text: "text-slate-500",
    icon: XCircle,
  },
};

export const STATUS_ICON_COLOR: Record<PlanStatus, string> = {
  PENDING: "#d97706",
  APPLYING: "#9333ea",
  ACTIVE: "#2563eb",
  COMPLETED: "#059669",
  CANCELLED: "#64748b",
};

export const STATUS_APPLY_CONFIG: Record<
  PlanStatus,
  { labelKey: string; icon: any; bg: string; text: string; ring: string }
> = {
  PENDING: {
    labelKey: "plan.status.PENDING",
    icon: CircleDashed,
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-500",
    ring: "ring-amber-200",
  },
  APPLYING: {
    labelKey: "plan.status.APPLYING",
    icon: Loader,
    bg: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-500",
    ring: "ring-purple-200",
  },
  ACTIVE: {
    labelKey: "plan.status.ACTIVE",
    icon: Play,
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-500",
    ring: "ring-blue-200",
  },
  COMPLETED: {
    labelKey: "plan.status.COMPLETED",
    icon: CheckCircle2,
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-500",
    ring: "ring-emerald-200",
  },
  CANCELLED: {
    labelKey: "plan.status.CANCELLED",
    icon: XCircle,
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-400",
    ring: "ring-slate-200",
  },
};

// ── Severity configs (PlanCard) ───────────────────────────────────────────────

export type SeverityStyle = { badge: string; text: string };

export const SEVERITY_STYLE: Record<string, SeverityStyle> = {
  LOW: { badge: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  MEDIUM: { badge: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  HIGH: { badge: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  CRITICAL: { badge: "bg-red-50 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

// ── Source type configs (PlanCard) ────────────────────────────────────────────

export type SourceStyle = { badge: string; text: string; labelKey: string };

export const SOURCE_STYLE: Record<string, SourceStyle> = {
  CONSULTED: {
    badge: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    labelKey: "plan.card.consulted",
  },
  RAG_GEN: {
    badge: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    labelKey: "plan.card.aiGenerated",
  },
  USER_CREATED: {
    badge: "bg-slate-50 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    labelKey: "plan.card.userCreated",
  },
};

export const SOURCE_ICON_COLOR: Record<string, string> = {
  CONSULTED: "#059669",
  RAG_GEN: "#9333ea",
  USER_CREATED: "#64748b",
};

// ── Tab switcher constants (PlanScreen) ───────────────────────────────────────

export const TAB_ACTIVE_COLOR = "#059669";
export const TAB_INACTIVE_COLOR = "#64748b";

export const ALL_STATUSES: PlanStatus[] = [
  "PENDING",
  "APPLYING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];
