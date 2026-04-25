import type { ImagePickerAsset } from "expo-image-picker";

import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";

// ── Leaf detection (YOLO) ──────────────────────────────────────────

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LeafDetection {
  className: string;
  confidenceScore: number;
  boundingBox: BoundingBox;
  localPrediction?: PredictionResponse;
}

export interface LeafDetectionResponse {
  detections: LeafDetection[];
  modelName: string;
  imageWidth: number;
  imageHeight: number;
  processingTimeMs: number | null;
  detectionCount: number;
}

// ── Disease prediction (MobileNetV2) ───────────────────────────────

export interface PredictionResult {
  className: string;
  confidenceScore: number;
}

export interface PredictionResponse {
  predictions: PredictionResult[];
  modelName: string;
  processingTimeMs: number | null;
}

// ── Diagnosis history ──────────────────────────────────────────────

export interface DiagnoseRequest {
  diagnoseRequestId: string;
  userId: string;
  imageFileName: string;
  imageContentType: string;
  timeStamp: string;
}

export interface DiagnoseResult {
  diagnoseResultId: string;
  diagnoseRequestId: string;
  userId: string;
  result: { diseaseName: string; confidenceScore: number }[];
  timeStamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────

const resolveFileName = (asset: ImagePickerAsset): string => {
  if (asset.fileName) return asset.fileName;
  const nameFromPath = asset.uri.split("/").pop();
  return nameFromPath || `leaf-${Date.now()}.jpg`;
};

const resolveFileType = (asset: ImagePickerAsset): string => {
  return asset.mimeType || "image/jpeg";
};

const buildImageFormData = (asset: ImagePickerAsset): FormData => {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: resolveFileName(asset),
    type: resolveFileType(asset),
  } as never);
  return formData;
};

// ── API ────────────────────────────────────────────────────────────

export const diseaseDetectionApi = {
  detectLeaf: async (
    asset: ImagePickerAsset,
  ): Promise<LeafDetectionResponse> => {
    const response = await apiClient.post<ApiResponse<LeafDetectionResponse>>(
      API_ENDPOINTS.DISEASES.DETECT_LEAF,
      buildImageFormData(asset),
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      },
    );
    return response.data.data;
  },

  predict: async (asset: ImagePickerAsset): Promise<PredictionResponse> => {
    const response = await apiClient.post<ApiResponse<PredictionResponse>>(
      API_ENDPOINTS.DISEASES.PREDICT,
      buildImageFormData(asset),
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      },
    );
    return response.data.data;
  },

  predictFromUri: async (
    uri: string,
    filename: string,
  ): Promise<PredictionResponse> => {
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: filename,
      type: "image/jpeg",
    } as never);

    const response = await apiClient.post<ApiResponse<PredictionResponse>>(
      API_ENDPOINTS.DISEASES.PREDICT,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      },
    );
    return response.data.data;
  },

  getDiagnoseHistory: async (
    page = 0,
    size = 20,
  ): Promise<ApiResponse<DiagnoseRequest[]>> => {
    const response = await apiClient.get<ApiResponse<DiagnoseRequest[]>>(
      API_ENDPOINTS.DISEASES.DIAGNOSE_REQUESTS,
      { params: { page, size } },
    );
    return response.data;
  },

  getDiagnoseResult: async (
    requestId: string,
  ): Promise<ApiResponse<DiagnoseResult>> => {
    const response = await apiClient.get<ApiResponse<DiagnoseResult>>(
      API_ENDPOINTS.DISEASES.DIAGNOSE_RESULT_BY_REQUEST(requestId),
    );
    return response.data;
  },
};
