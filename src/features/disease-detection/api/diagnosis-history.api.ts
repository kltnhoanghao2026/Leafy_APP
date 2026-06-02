import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DiagnoseRequestDto {
  diagnoseRequestId: string;
  userId: string;
  imageFileName: string;
  imageContentType: string;
  fileId?: string | null;
  timeStamp: string;
  plantId?: string | null;
  farmPlotId?: string | null;
  farmZoneId?: string | null;
}

export interface DiagnoseResultDto {
  diagnoseResultId: string;
  diagnoseRequestId: string;
  userId: string;
  result: { diseaseName: string; confidenceScore: number }[];
  timeStamp: string;
}

export const diagnosisHistoryApi = {
  getRequests: async (page = 0, size = 20) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<DiagnoseRequestDto>>>(
      API_ENDPOINTS.DISEASES.DIAGNOSE_REQUESTS,
      { params: { page, size } },
    );
    return response.data;
  },

  getResults: async (page = 0, size = 50) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<DiagnoseResultDto>>>(
      API_ENDPOINTS.DISEASES.DIAGNOSE_RESULTS,
      { params: { page, size } },
    );
    return response.data;
  },

  getResultByRequest: async (requestId: string) => {
    const response = await apiClient.get<ApiResponse<DiagnoseResultDto>>(
      API_ENDPOINTS.DISEASES.DIAGNOSE_RESULT_BY_REQUEST(requestId),
    );
    return response.data;
  },

  updateRequestPlant: async (requestId: string, plantId: string | null) => {
    const response = await apiClient.put<ApiResponse<void>>(
      `/diseases/diagnose/requests/${requestId}/plant`,
      { plantId }
    );
    return response.data;
  },
};
