import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";

import type {
  DeviceDetailResponse,
  DeviceResponse,
  GenerateClaimCodeResponse,
  LatestReadingItemResponse,
  ClaimDeviceRequest,
  MyDevicesParams,
  PagedResponse,
  ProvisionDeviceRequest,
} from "../types";

type BackendPagedResponse<T> = PagedResponse<T> & {
  content?: T[];
  totalElements?: number;
};

const cleanParams = (params?: MyDevicesParams): MyDevicesParams | undefined => {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  ) as MyDevicesParams;
};

const normalizePagedResponse = <T>(
  response: BackendPagedResponse<T>,
): PagedResponse<T> => {
  const items = response.items ?? response.content ?? [];
  const totalItems = response.totalItems ?? response.totalElements ?? items.length;

  return {
    ...response,
    items,
    totalItems,
    totalElements: response.totalElements ?? totalItems,
    page: response.page ?? 0,
    size: response.size ?? items.length,
    totalPages: response.totalPages ?? 1,
  };
};

export const collectorApi = {
  async getMyDevices(
    params?: MyDevicesParams,
  ): Promise<PagedResponse<DeviceResponse>> {
    const response = await apiClient.get<BackendPagedResponse<DeviceResponse>>(
      API_ENDPOINTS.IOT.DEVICES.ME,
      { params: cleanParams(params) },
    );

    return normalizePagedResponse(response.data);
  },

  async getDeviceDetail(deviceId: string): Promise<DeviceDetailResponse> {
    const response = await apiClient.get<DeviceDetailResponse>(
      API_ENDPOINTS.IOT.DEVICES.DETAIL(deviceId),
    );

    return response.data;
  },

  async getDeviceLatestReadings(
    deviceId: string,
  ): Promise<LatestReadingItemResponse[]> {
    const response = await apiClient.get<LatestReadingItemResponse[]>(
      API_ENDPOINTS.IOT.DEVICES.LATEST_READINGS(deviceId),
    );

    return response.data;
  },

  async provisionDevice(
    payload: ProvisionDeviceRequest,
  ): Promise<DeviceResponse> {
    const response = await apiClient.post<DeviceResponse>(
      API_ENDPOINTS.IOT.DEVICES.PROVISION,
      payload,
    );

    return response.data;
  },

  async generateClaimCode(
    deviceId: string,
  ): Promise<GenerateClaimCodeResponse> {
    const response = await apiClient.post<GenerateClaimCodeResponse>(
      API_ENDPOINTS.IOT.DEVICES.CLAIM_CODE(deviceId),
    );

    return response.data;
  },

  async claimDevice(payload: ClaimDeviceRequest): Promise<DeviceResponse> {
    const response = await apiClient.post<DeviceResponse>(
      API_ENDPOINTS.IOT.DEVICES.CLAIM,
      payload,
    );

    return response.data;
  },
};
