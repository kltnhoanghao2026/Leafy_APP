import type { ImagePickerAsset } from "expo-image-picker";

import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";

// ─── Internal types ────────────────────────────────────────────────────────────

interface UploadedFileRecord {
  id: string;
  fileType?: string;
}

const MAX_PRESIGNED_EXPIRATION_MINUTES = 60 * 24 * 7;

// ─── Helper utilities ──────────────────────────────────────────────────────────

const resolveFileName = (asset: ImagePickerAsset): string => {
  if (asset.fileName) return asset.fileName;
  const nameFromPath = asset.uri.split("/").pop();
  return nameFromPath || `upload-${Date.now()}.jpg`;
};

const resolveMimeType = (asset: ImagePickerAsset): string =>
  asset.mimeType ?? "image/jpeg";

// ─── Core upload function ──────────────────────────────────────────────────────

export interface UploadedFile {
  /** ID stored in the file-service */
  fileId: string;
  /** Broad category returned by file-service: PDF | IMAGE | DOCUMENT | OTHER */
  fileType: string;
  /** Pre-signed URL valid for MAX_PRESIGNED_EXPIRATION_MINUTES */
  url: string;
}

/**
 * Uploads an asset to the file-service and returns the fileId, fileType, and
 * a fresh pre-signed URL. Use this for any file upload in the app.
 */
export const uploadFile = async (
  asset: ImagePickerAsset,
): Promise<UploadedFile> => {
  const fileName = asset.fileName || `upload-${Date.now()}.jpg`;
  const mimeType = asset.mimeType || "image/jpeg";

  console.info("[File Upload] Preparing upload", {
    uri: asset.uri,
    fileName,
    mimeType,
  });

  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    type: mimeType,
    name: fileName,
  });

  const uploadUrl = `${apiClient.defaults.baseURL}${API_ENDPOINTS.FILES.UPLOAD}`;
  console.info("[File Upload] Starting POST to", uploadUrl);

  try {
    // Explicitly set Content-Type to multipart/form-data for file uploads
    const uploadResponse = await apiClient.post<ApiResponse<UploadedFileRecord>>(
      API_ENDPOINTS.FILES.UPLOAD,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const fileId = uploadResponse.data.data.id;
    const fileType = uploadResponse.data.data.fileType ?? "IMAGE";

    const signedUrlResponse = await apiClient.get<ApiResponse<string>>(
      API_ENDPOINTS.FILES.PRESIGNED_URL(fileId),
      { params: { expirationMinutes: MAX_PRESIGNED_EXPIRATION_MINUTES } },
    );

    console.info("[File Upload] Success", { fileId, fileType });

    return { fileId, fileType, url: signedUrlResponse.data.data };
  } catch (error) {
    console.error("[File Upload] Failed", {
      url: uploadUrl,
      error: error instanceof Error ? error.message : String(error),
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data,
    });
    throw error;
  }
};

// ─── Convenience wrappers (kept for backward compatibility) ───────────────────

export const fileApi = {
  /** Upload an avatar; returns only the pre-signed URL. */
  uploadAvatar: async (asset: ImagePickerAsset): Promise<string> => {
    const { url } = await uploadFile(asset);
    return url;
  },

  /** Upload a certificate proof; returns fileId, fileType, and pre-signed URL. */
  uploadProof: async (asset: ImagePickerAsset): Promise<UploadedFile> =>
    uploadFile(asset),

  /** Upload a community post media asset; returns url and derived media type. */
  uploadPostMedia: async (
    asset: ImagePickerAsset,
  ): Promise<{ url: string; type: string }> => {
    const { url } = await uploadFile(asset);
    const mediaType = resolveMimeType(asset).startsWith("video")
      ? "video"
      : "image";
    return { url, type: mediaType };
  },
};
