import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";
import type { PageResponse, PlanListParams, PlanResponse, PlanApplyResponse, PlanStatus, TrackingGranularity } from "../schemas/plan.schema";

export const planApi = {
  getMyPlans: (params: PlanListParams = {}) => {
    return apiClient.get<ApiResponse<PageResponse<PlanResponse>>>(
      API_ENDPOINTS.PLANS.MY,
      {
        params: {
          sortBy: "createdAt",
          sortDir: "DESC",
          ...params,
          plantId: params.plantId || undefined,
          search: params.search || undefined,
          sourceType: params.sourceType || undefined,
        },
      },
    );
  },

  getPublicPlans: (params: PlanListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<PlanResponse>>>(
      API_ENDPOINTS.PLANS.PUBLIC,
      {
        params: {
          sortBy: "createdAt",
          sortDir: "DESC",
          ...params,
          search: params.search || undefined,
          sourceType: params.sourceType || undefined,
        },
      },
    ),

  getMyApplies: (params: PlanListParams & { status?: PlanStatus | "" } = {}) =>
    apiClient.get<ApiResponse<PageResponse<PlanApplyResponse>>>(
      API_ENDPOINTS.PLANS.MY_APPLIES,
      {
        params: {
          sortBy: "createdAt",
          sortDir: "DESC",
          ...params,
          status: params.status || undefined,
        },
      },
    ),

  getPlanDetail: (planId: string) =>
    apiClient.get<ApiResponse<PlanResponse>>(API_ENDPOINTS.PLANS.ITEM(planId)),

  togglePlanVisibility: (planId: string) =>
    apiClient.put<ApiResponse<PlanResponse>>(API_ENDPOINTS.PLANS.VISIBILITY(planId)),

  deletePlan: (planId: string) =>
    apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.PLANS.ITEM(planId)),

  applyPlan: (planId: string, payload: { plantId?: string; farmPlotId?: string; farmZoneId?: string; startDate: string; trackingGranularity?: TrackingGranularity; excludedPlantIds?: string[]; excludedFarmZoneIds?: string[] }) =>
    apiClient.post<ApiResponse<PlanApplyResponse>>(API_ENDPOINTS.PLANS.APPLY(planId), payload),

  updateApplyStatus: (applyId: string, status: PlanStatus) =>
    apiClient.patch<ApiResponse<PlanApplyResponse>>(API_ENDPOINTS.PLANS.APPLY_STATUS(applyId), null, { params: { status } }),

  getApplyDetail: (applyId: string) =>
    apiClient.get<ApiResponse<PlanApplyResponse>>(API_ENDPOINTS.PLANS.APPLY_DETAIL(applyId)),

  cancelApply: (applyId: string) =>
    apiClient.post<ApiResponse<PlanApplyResponse>>(API_ENDPOINTS.PLANS.CANCEL_APPLY(applyId)),

  completeApply: (applyId: string, success: boolean) =>
    apiClient.patch<ApiResponse<PlanApplyResponse>>(
      API_ENDPOINTS.PLANS.COMPLETE_APPLY(applyId),
      { success },
    ),

  createPlan: (body: {
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
    schedule?: Array<{
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
      tasks?: Array<{
        title: string;
        description?: string;
        order?: number;
        estimatedCost?: string;
        completed?: boolean;
      }>;
    }>;
    isPublic?: boolean;
  }) =>
    apiClient.post<ApiResponse<PlanResponse>>(API_ENDPOINTS.PLANS.CREATE, body),
};
