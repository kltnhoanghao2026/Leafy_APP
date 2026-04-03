import type {
  PageParams,
  PageResponse,
  SortDirection,
} from "../../plant/components/plant.types";
import {
  Droplets,
  Beaker,
  Trash2,
  Scissors,
  Search,
  Bug,
  Syringe,
  ShieldAlert,
  HeartPulse,
  Activity,
  PackageOpen,
  Wheat,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export type { PageParams, PageResponse, SortDirection };

export const EVENT_TYPE_VALUES = [
  "IRRIGATION",
  "NUTRITION",
  "WEED_CONTROL",
  "PRUNING",
  "SCOUTING",
  "DISEASE_DETECTED",
  "TREATMENT_APPLICATION",
  "QUARANTINE",
  "HEALTH_RECOVERY",
  "PHENOLOGY",
  "REPOT",
  "HARVEST",
] as const;

export type EventType = (typeof EVENT_TYPE_VALUES)[number];

// ── Category groupings for UI ─────────────────────────────────────────────

export type EventCategory =
  | "ROUTINE_CARE"
  | "HEALTH_MEDICAL"
  | "GROWTH_LIFECYCLE";

export const EVENT_CATEGORY_MAP: Record<EventType, EventCategory> = {
  IRRIGATION: "ROUTINE_CARE",
  NUTRITION: "ROUTINE_CARE",
  WEED_CONTROL: "ROUTINE_CARE",
  PRUNING: "ROUTINE_CARE",
  SCOUTING: "HEALTH_MEDICAL",
  DISEASE_DETECTED: "HEALTH_MEDICAL",
  TREATMENT_APPLICATION: "HEALTH_MEDICAL",
  QUARANTINE: "HEALTH_MEDICAL",
  HEALTH_RECOVERY: "HEALTH_MEDICAL",
  PHENOLOGY: "GROWTH_LIFECYCLE",
  REPOT: "GROWTH_LIFECYCLE",
  HARVEST: "GROWTH_LIFECYCLE",
};

export const EVENT_CATEGORY_COLORS: Record<
  EventCategory,
  { bg: string; darkBg: string; text: string; darkText: string }
> = {
  ROUTINE_CARE: {
    bg: "bg-blue-50",
    darkBg: "dark:bg-blue-900/20",
    text: "text-blue-600",
    darkText: "dark:text-blue-400",
  },
  HEALTH_MEDICAL: {
    bg: "bg-orange-50",
    darkBg: "dark:bg-orange-900/20",
    text: "text-orange-600",
    darkText: "dark:text-orange-400",
  },
  GROWTH_LIFECYCLE: {
    bg: "bg-emerald-50",
    darkBg: "dark:bg-emerald-900/20",
    text: "text-emerald-600",
    darkText: "dark:text-emerald-400",
  },
};

export const getEventCategory = (eventType: EventType): EventCategory =>
  EVENT_CATEGORY_MAP[eventType] ?? "ROUTINE_CARE";

export const getEventCategoryColors = (eventType: EventType) =>
  EVENT_CATEGORY_COLORS[getEventCategory(eventType)];

// ── Event type icons ──────────────────────────────────────────────────────

export const EVENT_TYPE_ICONS: Record<EventType, LucideIcon> = {
  IRRIGATION: Droplets,
  NUTRITION: Beaker,
  WEED_CONTROL: Trash2,
  PRUNING: Scissors,
  SCOUTING: Search,
  DISEASE_DETECTED: Bug,
  TREATMENT_APPLICATION: Syringe,
  QUARANTINE: ShieldAlert,
  HEALTH_RECOVERY: HeartPulse,
  PHENOLOGY: Activity,
  REPOT: PackageOpen,
  HARVEST: Wheat,
};

export const getEventTypeIcon = (eventType: EventType): LucideIcon =>
  EVENT_TYPE_ICONS[eventType] ?? Droplets;

// ── Event target ─────────────────────────────────────────────────────────

export type EventTargetType = "PLANT" | "FARM_PLOT" | "FARM_ZONE";

// ── DTOs ──────────────────────────────────────────────────────────────────

export type PlantEventResponse = {
  id: string;
  plantId?: string | null;
  farmPlotId?: string | null;
  farmZoneId?: string | null;
  eventType: EventType;
  note: string;
  description?: string | null;
  daysFromNow?: number | null;
  durationDays?: number | null;
  planned: boolean;
  calculatedStartDate?: string | null;
  calculatedEndDate?: string | null;
  phiDays?: number | null;
  ppeRequired?: string | null;
  mrlNote?: string | null;
  estimatedCost?: string | null;
  sourcePlanId?: string | null;
  createdAt?: string | null;
  lastModifiedAt?: string | null;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
  active: boolean;
};

export type PlantEventCreateRequest = {
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  eventType: EventType;
  note: string;
  description?: string;
  daysFromNow?: number;
  durationDays?: number;
  isPlanned: boolean;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  estimatedCost?: string;
  sourcePlanId?: string;
};

export type PlantEventUpdateRequest = Partial<
  Omit<PlantEventCreateRequest, "plantId" | "farmPlotId" | "farmZoneId">
>;

export type CalendarParams = {
  farmPlotId?: string;
  farmZoneId?: string;
  plantId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};
