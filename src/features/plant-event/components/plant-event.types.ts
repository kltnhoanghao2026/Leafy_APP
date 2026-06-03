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
  AlertTriangle,
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
  "ALERT_TRIGGERED",
] as const;

export type EventType = (typeof EVENT_TYPE_VALUES)[number];

// ── Category groupings for UI ─────────────────────────────────────────────

export type EventCategory =
  | "ROUTINE_CARE"
  | "HEALTH_MEDICAL"
  | "GROWTH_LIFECYCLE"
  | "ALERTS";

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
  ALERT_TRIGGERED: "ALERTS",
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
  ALERTS: {
    bg: "bg-red-50",
    darkBg: "dark:bg-red-900/20",
    text: "text-red-600",
    darkText: "dark:text-red-400",
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
  ALERT_TRIGGERED: AlertTriangle,
};

export const getEventTypeIcon = (eventType: EventType): LucideIcon =>
  EVENT_TYPE_ICONS[eventType] ?? Droplets;

// ── Event type labels ───────────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  IRRIGATION: "Tưới nước",
  NUTRITION: "Bón phân",
  WEED_CONTROL: "Diệt cỏ",
  PRUNING: "Tỉa cành",
  SCOUTING: "Theo dõi",
  DISEASE_DETECTED: "Phát hiện bệnh",
  TREATMENT_APPLICATION: "Phun thuốc",
  QUARANTINE: "Cách ly",
  HEALTH_RECOVERY: "Hồi phục",
  PHENOLOGY: "Sinh trưởng",
  REPOT: "Thay chậu",
  HARVEST: "Thu hoạch",
  ALERT_TRIGGERED: "Cảnh báo",
};

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
  daysFromStart?: number | null;
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
  /** True when this event is the last incomplete event belonging to a PlanApply. Used to trigger the success prompt. */
  isLastIncompleteEventForApply?: boolean | null;
  /** Summary of the PlanApply this event belongs to. */
  planApply?: {
    id: string;
    planName?: string | null;
    diseaseName?: string | null;
    targetName?: string | null;
    status: string;
    success?: boolean | null;
  } | null;
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

  /** Denormalized plant info for quick display. */
  plant?: {
    id: string;
    plantNumber: string;
    nickName?: string | null;
    tagCode?: string | null;
    speciesId?: string | null;
    farmPlotId?: string | null;
    farmZoneId?: string | null;
  } | null;

  /** Denormalized farm plot info for quick display. */
  farmPlot?: {
    id: string;
    name: string;
    code?: string | null;
    addressLine?: string | null;
  } | null;

  /** Denormalized farm zone info for quick display. */
  farmZone?: {
    id: string;
    farmPlotId?: string | null;
    zoneName: string;
    zoneCode?: string | null;
  } | null;

  /** File IDs of images/videos attached to this event. */
  attachmentIds?: string[] | null;
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
  daysFromStart?: number;
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
  /** File IDs referencing attachments stored in file-service. */
  attachmentIds?: string[];
};

export interface PlantEventUpdateRequest {
  farmPlotId?: string;
  farmZoneId?: string;
  /** Optional scope correction. Null leaves existing targetType unchanged. */
  targetType?: TargetType;
  eventType?: EventType;
  note?: string;
  description?: string;
  daysFromStart?: number;
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
  /** File IDs referencing attachments stored in file-service. Null means leave unchanged. */
  attachmentIds?: string[] | null;
}

export type CalendarParams = {
  farmPlotId?: string;
  farmZoneId?: string;
  plantId?: string;
  profileId?: string;
  sourcePlanId?: string;
  planApplyId?: string;
  eventType?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};
