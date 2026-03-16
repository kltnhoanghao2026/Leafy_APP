import { apiClient } from "@/src/lib/axios";
import { type ApiResponse } from "@/src/shared/api";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { UserProfile } from "../schema/user.schema";

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<ApiResponse<UserProfile>>(
    API_ENDPOINTS.PROFILES.ME,
  );
  return response.data.data;
};
