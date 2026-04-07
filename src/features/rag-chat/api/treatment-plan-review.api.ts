import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type {
  EventType,
  PlantEventCreateRequest,
} from "@/src/features/plant-event/components/plant-event.types";
import type { TreatmentPlanSource } from "../utils/treatmentPlanNormalizer";
import type { ApiResponse } from "@/src/shared/api";

export type TreatmentPlanCreateEventRequest = Omit<
  PlantEventCreateRequest,
  "eventType"
> & {
  eventType: EventType;
};

export type TreatmentPlanCreateRequest = {
  ragPlanId?: string;
  question?: string;
  source?: TreatmentPlanSource;
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  diseaseName: string;
  confidenceScore?: number;
  severityLevel?: string;
  urgency?: string;
  requiredInputs?: string[];
  safetyWarnings?: string[];
  successIndicators?: string;
  estimatedCost?: string;
  schedule: TreatmentPlanCreateEventRequest[];
};

export type TreatmentPlanResponse = {
  id: string;
  ragPlanId?: string;
  question?: string;
  source?: TreatmentPlanSource;
  userId?: string;
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  diseaseName?: string;
  confidenceScore?: number;
  severityLevel?: string;
  urgency?: string;
  requiredInputs?: string[];
  safetyWarnings?: string[];
  successIndicators?: string;
  estimatedCost?: string;
  plantEventIds?: string[];
  status?: string;
};

export const treatmentPlanReviewApi = {
  createPlan: (body: TreatmentPlanCreateRequest) =>
    apiClient.post<ApiResponse<TreatmentPlanResponse>>(
      API_ENDPOINTS.TREATMENT_PLANS.CREATE,
      body,
    ),
};
