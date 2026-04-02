import type { ImagePickerAsset } from "expo-image-picker";

import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";

interface UploadedFile {
  id: string;
}

const MAX_PRESIGNED_EXPIRATION_MINUTES = 60 * 24 * 7;

const resolveFileName = (asset: ImagePickerAsset): string => {
  if (asset.fileName) {
    return asset.fileName;
  }

  const nameFromPath = asset.uri.split("/").pop();
  return nameFromPath || `avatar-${Date.now()}.jpg`;
};

const resolveFileType = (asset: ImagePickerAsset): string => {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  return "image/jpeg";
};

export const fileApi = {
  uploadAvatar: async (asset: ImagePickerAsset): Promise<string> => {
    const formData = new FormData();
    formData.append("file", {
      uri: asset.uri,
      name: resolveFileName(asset),
      type: resolveFileType(asset),
    } as never);

    const uploadResponse = await apiClient.post<ApiResponse<UploadedFile>>(
      API_ENDPOINTS.FILES.UPLOAD,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const fileId = uploadResponse.data.data.id;

    const signedUrlResponse = await apiClient.get<ApiResponse<string>>(
      API_ENDPOINTS.FILES.PRESIGNED_URL(fileId),
      {
        params: {
          expirationMinutes: MAX_PRESIGNED_EXPIRATION_MINUTES,
        },
      },
    );

    return signedUrlResponse.data.data;
  },
};
