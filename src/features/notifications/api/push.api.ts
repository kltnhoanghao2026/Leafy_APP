import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";
import type { RegisterPushTokenPayload } from "../types";

export const pushApi = {
  async registerToken(payload: RegisterPushTokenPayload) {
    const response = await apiClient.post<ApiResponse<null>>(
      API_ENDPOINTS.PUSH_TOKENS.REGISTER,
      payload,
    );
    return response.data;
  },

  async deactivateToken(fcmToken: string) {
    const response = await apiClient.post<ApiResponse<null>>(
      API_ENDPOINTS.PUSH_TOKENS.DEACTIVATE,
      { fcmToken },
    );
    return response.data;
  },
};
