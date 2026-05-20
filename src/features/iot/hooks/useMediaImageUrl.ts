import { queryOptions, useQuery } from "@tanstack/react-query";

import { fileApi } from "@/src/features/common/api/file.api";

export const mediaImageUrlQueryOptions = (fileId?: string | null) =>
  queryOptions({
    queryKey: ["files", fileId, "presigned-url"],
    queryFn: () => fileApi.getPresignedUrl(fileId as string),
    enabled: Boolean(fileId),
    staleTime: 1000 * 60 * 30,
  });

export const useMediaImageUrl = (fileId?: string | null) => {
  return useQuery(mediaImageUrlQueryOptions(fileId));
};
