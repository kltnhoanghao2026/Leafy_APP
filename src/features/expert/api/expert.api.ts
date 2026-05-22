import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";
import type { ExpertsPage, ExpertProfile } from "../types/expert.types";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=Leafy";

const resolveAvatar = (profile: ExpertProfile): string => {
  return (
    profile.profilePicture?.trim() ||
    profile.avatar?.trim() ||
    FALLBACK_AVATAR
  );
};

export const expertApi = {
  getExperts: async (
    searchTerm?: string,
    page = 0,
    size = 20,
  ): Promise<ExpertsPage> => {
    const response = await apiClient.get<ApiResponse<ExpertsPage>>(
      API_ENDPOINTS.PROFILES.EXPERTS,
      {
        params: {
          searchTerm: searchTerm || undefined,
          page,
          size,
        },
      },
    );

    const payload = response.data.data;

    return {
      ...payload,
      content: (payload.content ?? []).map((expert) => ({
        ...expert,
        profilePicture: resolveAvatar(expert),
      })),
    };
  },

  searchExperts: async (
    searchTerm: string,
    specialty?: string,
    page = 0,
    size = 20,
  ): Promise<ExpertsPage> => {
    const response = await apiClient.get<ApiResponse<ExpertsPage>>(
      API_ENDPOINTS.PROFILES.SEARCH_EXPERTS,
      {
        params: {
          searchTerm: searchTerm || undefined,
          specialty: specialty || undefined,
          page,
          size,
        },
      },
    );

    const payload = response.data.data;

    return {
      ...payload,
      content: (payload.content ?? []).map((expert) => ({
        ...expert,
        profilePicture: resolveAvatar(expert),
      })),
    };
  },

  getExpertById: async (expertId: string): Promise<ExpertProfile> => {
    const response = await apiClient.get<ApiResponse<ExpertProfile>>(
      API_ENDPOINTS.PROFILES.GET(expertId),
    );

    const expert = response.data.data;
    return {
      ...expert,
      profilePicture: resolveAvatar(expert),
    };
  },

  requestConsultation: async (
    expertProfileId: string,
  ): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.PROFILES.EXPERT_CONSULT_REQUEST(expertProfileId),
      null,
    );
  },

  cancelConsultationRequest: async (
    expertProfileId: string,
  ): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.PROFILES.EXPERT_CONSULT_CANCEL(expertProfileId),
      null,
    );
  },

  followUser: async (profileId: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.PROFILES.FOLLOW(profileId),
      null,
    );
  },

  unfollowUser: async (profileId: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.PROFILES.UNFOLLOW(profileId),
      null,
    );
  },
};
