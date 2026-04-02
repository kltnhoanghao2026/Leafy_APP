import { queryOptions } from "@tanstack/react-query";
import { profileApi } from "../api/profile-api";

export const profileKeys = {
  all: () => ["profiles"] as const,
  me: () => [...profileKeys.all(), "me"] as const,
  detail: (profileId: string) =>
    [...profileKeys.all(), "detail", profileId] as const,
  byUser: (userId: string) => [...profileKeys.all(), "user", userId] as const,
};

export const MY_PROFILE_QUERY_KEY = profileKeys.me();

export const getMyProfileQueryOptions = () =>
  queryOptions({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: profileApi.getMyProfile,
  });

export const getProfileByIdQueryOptions = (profileId: string) =>
  queryOptions({
    queryKey: profileKeys.detail(profileId),
    queryFn: () => profileApi.getProfileById(profileId),
    enabled: Boolean(profileId),
  });

export const getProfileByUserIdQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: profileKeys.byUser(userId),
    queryFn: () => profileApi.getProfileByUserId(userId),
    enabled: Boolean(userId),
  });
