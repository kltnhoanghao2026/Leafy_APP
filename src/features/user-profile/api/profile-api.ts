import { apiClient } from "@/src/lib/axios";
import { type ApiResponse } from "@/src/shared/api";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type {
  ProfileUpdateRequest,
  ProfileResponse,
} from "../schema/user.schema";

export const profileApi = {
  getMyProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ApiResponse<ProfileResponse>>(
      API_ENDPOINTS.PROFILES.ME,
    );
    return response.data.data;
  },

  getProfileById: async (profileId: string): Promise<ProfileResponse> => {
    const response = await apiClient.get<ApiResponse<ProfileResponse>>(
      API_ENDPOINTS.PROFILES.GET(profileId),
    );
    return response.data.data;
  },

  getProfileByUserId: async (userId: string): Promise<ProfileResponse> => {
    const response = await apiClient.get<ApiResponse<ProfileResponse>>(
      API_ENDPOINTS.PROFILES.GET_BY_USER(userId),
    );
    return response.data.data;
  },

  updateProfile: async (
    profileId: string,
    body: ProfileUpdateRequest,
  ): Promise<ProfileResponse> => {
    const response = await apiClient.put<ApiResponse<ProfileResponse>>(
      API_ENDPOINTS.PROFILES.GET(profileId),
      body,
    );
    return response.data.data;
  },

  updateProfileByUserId: async (
    userId: string,
    body: ProfileUpdateRequest,
  ): Promise<ProfileResponse> => {
    const response = await apiClient.put<ApiResponse<ProfileResponse>>(
      API_ENDPOINTS.PROFILES.GET_BY_USER(userId),
      body,
    );
    return response.data.data;
  },
};

export const getMyProfile = profileApi.getMyProfile;
