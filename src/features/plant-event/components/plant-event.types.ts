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

// ── Event target (UI-level, used for screen routing / filter state) ──────

export type EventTargetType = "PLANT" | "FARM_PLOT" | "FARM_ZONE";

// ── Backend target type (matches FE / backend DTO) ──────────────────────

/** Scope of a PlantEvent or EmbeddedPlanEvent (backend DTO value). */
export type TargetType = "FARM" | "FARM_ZONE" | "PLANT";

// ── Tracking granularity ──────────────────────────────────────────────────

export type TrackingGranularity = "NONE" | "ZONE" | "PLANT";

// ── Event tasks ───────────────────────────────────────────────────────────

export interface EventTaskResponse {
  title: string;
  description: string | null;
  order: number | null;
  estimatedCost: string | null;
  completed: boolean;
}

export interface EventTaskRequest {
  title: string;
  description?: string;
  order?: number;
  estimatedCost?: string;
  completed?: boolean;
}

// ── Event progress ────────────────────────────────────────────────────────

export type EventProgressResponse = {
  id: string;
  eventId: string;
  targetType: "ZONE" | "PLANT";
  targetId: string;
  farmPlotId?: string | null;
  farmZoneId?: string | null;
  plantId?: string | null;
  completed: boolean;
  completedAt?: string | null;
  note?: string | null;
  createdAt?: string | null;
};

export type EventProgressUpdateRequest = {
  completed: boolean;
  note?: string;
};

// ── DTOs ──────────────────────────────────────────────────────────────────

export type PlantEventResponse = {
  id: string;
  plantId?: string | null;
  farmPlotId?: string | null;
  farmZoneId?: string | null;
  eventType: EventType;
  /** Scope this event targets: FARM (plot-level), FARM_ZONE (zone-level), or PLANT (individual). */
  targetType: TargetType | null;
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
  planApplyId?: string | null;
  /** ID of the parent PlantEvent in the hierarchy (FARM → FARM_ZONE → PLANT). */
  parentPlantEventId?: string | null;
  completed: boolean;
  createdAt?: string | null;
  lastModifiedAt?: string | null;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
  active: boolean;
  trackingGranularity?: TrackingGranularity | null;
  excludedPlantIds?: string[] | null;
  excludedFarmZoneIds?: string[] | null;
  progressTotal?: number | null;
  progressCompleted?: number | null;
  tasks: EventTaskResponse[] | null;
  /** Child events in the hierarchy (FARM → FARM_ZONE → PLANT). Empty array for leaf nodes. */
  children: PlantEventResponse[];
};

export type PlantEventCreateRequest = {
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  eventType: EventType;
  /**
   * Explicit scope override. Omit to let the server derive it automatically
   * from plantId / farmZoneId / farmPlotId.
   */
  targetType?: TargetType;
  note: string;
  description?: string;
  daysFromNow?: number;
  durationDays?: number;
  isPlanned?: boolean;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  estimatedCost?: string;
  sourcePlanId?: string;
  planApplyId?: string;
  parentPlantEventId?: string;
  tasks?: EventTaskRequest[];
  trackingGranularity?: TrackingGranularity;
  excludedPlantIds?: string[];
  excludedFarmZoneIds?: string[];
};

export interface PlantEventUpdateRequest {
  farmPlotId?: string;
  farmZoneId?: string;
  /** Optional scope correction. Null leaves existing targetType unchanged. */
  targetType?: TargetType;
  eventType?: EventType;
  note?: string;
  description?: string;
  daysFromNow?: number;
  durationDays?: number;
  isPlanned?: boolean;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  estimatedCost?: string;
  sourcePlanId?: string;
  planApplyId?: string;
  parentPlantEventId?: string;
  completed?: boolean;
  /** Replace the entire task list. Omit to leave tasks unchanged. */
  tasks?: EventTaskRequest[];
}

export type CalendarParams = {
  farmPlotId?: string;
  farmZoneId?: string;
  plantId?: string;
  profileId?: string;
  sourcePlanId?: string;
  planApplyId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};
