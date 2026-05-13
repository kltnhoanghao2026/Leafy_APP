import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type {
  EventType,
  PlantEventCreateRequest,
} from "@/src/features/plant-event/components/plant-event.types";
import type { PlanSource } from "../utils/planNormalizer";
import type { ApiResponse } from "@/src/shared/api";

export type PlanCreateEventRequest = Omit<
  PlantEventCreateRequest,
  "eventType"
> & {
  eventType: EventType;
};

export type PlanCreateRequest = {
  ragPlanId?: string;
  question?: string;
  source?: PlanSource;
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
  schedule: PlanCreateEventRequest[];
};

export type PlanResponse = {
  id: string;
  ragPlanId?: string;
  question?: string;
  source?: PlanSource;
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
  isPublic?: boolean;
};

export const planReviewApi = {
  createPlan: (body: PlanCreateRequest) =>
    apiClient.post<ApiResponse<PlanResponse>>(
      API_ENDPOINTS.PLANS.CREATE,
      body,
    ),
  updateVisibility: (planId: string, isPublic: boolean) =>
    apiClient.patch<ApiResponse<PlanResponse>>(
      API_ENDPOINTS.PLANS.VISIBILITY(planId),
      null,
      { params: { isPublic } },
    ),
};
