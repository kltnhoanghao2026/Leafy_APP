import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import { type ApiResponse } from "@/src/shared/api";
import type { CommunityPage } from "../components/community.types";

// ---------------------------------------------------------------------------
// Types matching backend PostSearchResponse
// ---------------------------------------------------------------------------

export type PostSearchAuthorInfo = {
  id: string;
  fullName: string;
  avatar: string;
  role: string;
  isVerified: boolean;
};

export type PostSearchResult = {
  id: string;
  authorId: string;
  authorInfo: PostSearchAuthorInfo | null;
  title: string;
  caption: string;
  hashtags: string[];
  postType: string;
  upvoteCount: number;
  commentCount: number;
  uploadedAt: string;
  current: boolean;
};

// ---------------------------------------------------------------------------
// Types matching backend ProfileResponse
// ---------------------------------------------------------------------------

export type ProfileSearchResult = {
  id: string;
  userId: string;
  fullName: string;
  profilePicture: string;
  avatar: string;
  role: string;
  specialty: string;
  isVerified: boolean;
  bio: string;
  addressLine: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  latitude: number;
  longitude: number;
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const searchApi = {
  searchPosts: async (
    searchTerm: string,
    page = 0,
    size = 20,
  ): Promise<CommunityPage<PostSearchResult>> => {
    const response = await apiClient.get<
      ApiResponse<CommunityPage<PostSearchResult>>
    >(API_ENDPOINTS.SEARCH.POSTS, {
      params: { searchTerm, page, size },
    });
    return response.data.data;
  },

  searchProfiles: async (
    searchTerm: string,
    page = 0,
    size = 20,
  ): Promise<CommunityPage<ProfileSearchResult>> => {
    const response = await apiClient.get<
      ApiResponse<CommunityPage<ProfileSearchResult>>
    >(API_ENDPOINTS.SEARCH.PROFILES, {
      params: { searchTerm, page, size },
    });
    return response.data.data;
  },
};
