import { queryOptions } from "@tanstack/react-query";
import { getMyProfile } from "../api/profile-api";

export const MY_PROFILE_QUERY_KEY = ["profiles", "me"] as const;

export const getMyProfileQueryOptions = () =>
  queryOptions({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: getMyProfile,
  });
