import type { EventTaskRequest, PlantEventCreateRequest } from "@/src/features/plant-event/components/plant-event.types";

// ── Plan Form State ─────────────────────────────────────────────────────────

export interface PlanFormState {
  diseaseName: string;
  planName: string;
  farmPlotId: string;
  speciesId: string;
  speciesName: string;
  severityLevel: string;
  successIndicators: string;
  estimatedCost: string;
  requiredInputs: string;
  safetyWarnings: string;
  isPublic: boolean;
}

export const emptyForm = (): PlanFormState => ({
  diseaseName: "",
  planName: "",
  farmPlotId: "",
  speciesId: "",
  speciesName: "",
  severityLevel: "",
  successIndicators: "",
  estimatedCost: "",
  requiredInputs: "",
  safetyWarnings: "",
  isPublic: false,
});

export const emptyEvent = (): Omit<
  PlantEventCreateRequest,
  "plantId" | "farmPlotId" | "farmZoneId"
> => ({
  eventType: "IRRIGATION",
  targetType: "PLANT",
  note: "",
  description: "",
  daysFromStart: undefined,
  durationDays: undefined,
  estimatedCost: "",
  phiDays: undefined,
  ppeRequired: "",
  mrlNote: "",
  tasks: [],
});

// ── Plan Info Errors ────────────────────────────────────────────────────────

export interface PlanInfoErrors {
  diseaseName?: string;
}

// ── Create Plan Request ─────────────────────────────────────────────────────

export interface CreatePlanRequest {
  planName?: string;
  source?: "websearch" | "documents";
  sourceType?: "USER_CREATED" | "CONSULTED" | "RAG_GEN";
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  diseaseName: string;
  confidenceScore?: number;
  severityLevel?: string;
  requiredInputs?: string[];
  safetyWarnings?: string[];
  successIndicators?: string;
  estimatedCost?: string;
  schedule?: PlanEventScheduleItem[];
  isPublic?: boolean;
}

export interface PlanEventScheduleItem {
  eventType: string;
  targetType?: "FARM" | "FARM_ZONE" | "PLANT";
  note: string;
  description?: string;
  daysFromStart?: number;
  durationDays?: number;
  estimatedCost?: string;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  tasks?: EventTaskRequest[];
}
