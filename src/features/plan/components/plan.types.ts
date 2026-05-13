export type PlanStatus = "PENDING" | "APPLYING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type TargetType = "FARM" | "FARM_ZONE" | "PLANT";
export type TrackingGranularity = "NONE" | "ZONE" | "PLANT";
export type PlantEventType =
  | "IRRIGATION"
  | "NUTRITION"
  | "WEED_CONTROL"
  | "PRUNING"
  | "SCOUTING"
  | "DISEASE_DETECTED"
  | "TREATMENT_APPLICATION"
  | "QUARANTINE"
  | "HEALTH_RECOVERY"
  | "PHENOLOGY"
  | "REPOT"
  | "HARVEST";

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuthorInfo {
  id: string | null;
  fullName: string | null;
  avatar: string | null;
  role: string | null;
  specialty: string | null;
  isVerified: boolean | null;
}

export interface EventTaskResponse {
  title: string;
  description: string | null;
  order: number | null;
  estimatedCost: string | null;
  completed: boolean;
}

export interface EmbeddedPlanEventResponse {
  eventType: PlantEventType;
  targetType: TargetType | null;
  note: string | null;
  description: string | null;
  daysFromNow: number | null;
  durationDays: number | null;
  phiDays: number | null;
  ppeRequired: string | null;
  mrlNote: string | null;
  estimatedCost: string | null;
  tasks: EventTaskResponse[] | null;
}

export interface PlanApplyResponse {
  id: string;
  planId: string;
  appliedById: string | null;
  plantId: string | null;
  farmPlotId: string | null;
  farmZoneId: string | null;
  planName?: string | null;
  diseaseName?: string | null;
  targetName?: string | null;
  startDate: string | null;
  trackingGranularity: TrackingGranularity | null;
  plantEventIds: string[] | null;
  status: PlanStatus;
  createdAt: string | null;
  lastModifiedAt: string | null;
}

export interface PlanResponse {
  id: string;
  creatorId: string | null;
  ownerId: string | null;
  ragPlanId: string | null;
  question: string | null;
  planName: string | null;
  source: string | null;
  diseaseName: string | null;
  confidenceScore: number | null;
  severityLevel: string | null;
  urgency: string | null;
  requiredInputs: string[] | null;
  safetyWarnings: string[] | null;
  successIndicators: string | null;
  estimatedCost: string | null;
  events: EmbeddedPlanEventResponse[] | null;
  applyCount: number | null;
  applies?: PlanApplyResponse[] | null;
  isPublic: boolean;
  isConsulted: boolean;
  ownerInfo: AuthorInfo | null;
  creatorInfo: AuthorInfo | null;
  createdAt: string | null;
  lastModifiedAt: string | null;
  createdBy: string | null;
  lastModifiedBy: string | null;
  active: boolean;
}

export interface PlanListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  plantId?: string;
  search?: string;
}
