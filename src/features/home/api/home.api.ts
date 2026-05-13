import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";
import type { AgricultureStatsResponse } from "./home.types";

export const homeApi = {
  getAgricultureStats: async (): Promise<AgricultureStatsResponse> => {
    const response = await apiClient.get<ApiResponse<AgricultureStatsResponse>>(
      API_ENDPOINTS.STATS.AGRICULTURE
    );
    return response.data.data;
  },
};
