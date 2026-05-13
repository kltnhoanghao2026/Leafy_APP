import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import { type ApiResponse } from "@/src/shared/api";

import type {
  DeviceDetailResponse,
  DeviceConfigResponse,
  DeviceResponse,
  GenerateClaimCodeResponse,
  LatestReadingItemResponse,
  ClaimDeviceRequest,
  ChartRange,
  AlertEventDetailResponse,
  AlertEventItemResponse,
  AlertEventsParams,
  DashboardOverviewResponse,
  MyDevicesParams,
  PagedResponse,
  ProvisionDeviceRequest,
  SensorChartResponse,
  SensorCode,
  UpdateDeviceConfigRequest,
  ZoneOverviewResponse,
} from "../types";

type BackendPagedResponse<T> = PagedResponse<T> & {
  content?: T[];
  totalElements?: number;
};

const cleanParams = <T extends Record<string, unknown>>(params?: T): T | undefined => {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  ) as T;
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
    const response = await apiClient.get<ApiResponse<BackendPagedResponse<DeviceResponse>>>(
      API_ENDPOINTS.IOT.DEVICES.ME,
      { params: cleanParams(params) },
    );

    return normalizePagedResponse(response.data.data);
  },

  async getAlertEvents(
    params?: AlertEventsParams,
  ): Promise<PagedResponse<AlertEventItemResponse>> {
    const response = await apiClient.get<ApiResponse<BackendPagedResponse<AlertEventItemResponse>>>(
      API_ENDPOINTS.IOT.ALERT_EVENTS,
      { params: cleanParams(params) },
    );

    return normalizePagedResponse(response.data.data);
  },

  async getAlertEventById(alertId: string): Promise<AlertEventDetailResponse> {
    const response = await apiClient.get<ApiResponse<AlertEventDetailResponse>>(
      API_ENDPOINTS.IOT.ALERT_EVENT(alertId),
    );

    return response.data.data;
  },

  async acknowledgeAlert(alertId: string): Promise<AlertEventDetailResponse> {
    const response = await apiClient.post<ApiResponse<AlertEventDetailResponse>>(
      API_ENDPOINTS.IOT.ALERT_EVENT_ACKNOWLEDGE(alertId),
    );

    return response.data.data;
  },

  async resolveAlert(alertId: string): Promise<AlertEventDetailResponse> {
    const response = await apiClient.post<ApiResponse<AlertEventDetailResponse>>(
      API_ENDPOINTS.IOT.ALERT_EVENT_RESOLVE(alertId),
    );

    return response.data.data;
  },

  async getDeviceDetail(deviceId: string): Promise<DeviceDetailResponse> {
    const response = await apiClient.get<ApiResponse<DeviceDetailResponse>>(
      API_ENDPOINTS.IOT.DEVICES.DETAIL(deviceId),
    );

    return response.data.data;
  },

  async getDeviceLatestReadings(
    deviceId: string,
  ): Promise<LatestReadingItemResponse[]> {
    const response = await apiClient.get<ApiResponse<LatestReadingItemResponse[]>>(
      API_ENDPOINTS.IOT.DEVICES.LATEST_READINGS(deviceId),
    );

    return response.data.data;
  },

  async provisionDevice(
    payload: ProvisionDeviceRequest,
  ): Promise<DeviceResponse> {
    const response = await apiClient.post<ApiResponse<DeviceResponse>>(
      API_ENDPOINTS.IOT.DEVICES.PROVISION,
      payload,
    );

    return response.data.data;
  },

  async generateClaimCode(
    deviceId: string,
  ): Promise<GenerateClaimCodeResponse> {
    const response = await apiClient.post<ApiResponse<GenerateClaimCodeResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CLAIM_CODE(deviceId),
    );

    return response.data.data;
  },

  async claimDevice(payload: ClaimDeviceRequest): Promise<DeviceResponse> {
    const response = await apiClient.post<ApiResponse<DeviceResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CLAIM,
      payload,
    );

    return response.data.data;
  },

  async getDeviceChart(
    deviceId: string,
    params: { sensorCode: SensorCode; range: ChartRange },
  ): Promise<SensorChartResponse> {
    const response = await apiClient.get<ApiResponse<SensorChartResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CHARTS(deviceId),
      { params },
    );

    return response.data.data;
  },

  async getZoneChart(
    zoneId: string,
    params: { sensorCode: SensorCode; range: ChartRange },
  ): Promise<SensorChartResponse> {
    const response = await apiClient.get<ApiResponse<SensorChartResponse>>(
      API_ENDPOINTS.IOT.FARM_ZONE_CHARTS(zoneId),
      { params },
    );

    return response.data.data;
  },

  async getDashboardOverview(
    farmPlotId: string,
  ): Promise<DashboardOverviewResponse> {
    const response = await apiClient.get<ApiResponse<DashboardOverviewResponse>>(
      API_ENDPOINTS.IOT.DASHBOARD_OVERVIEW,
      { params: { farmPlotId } },
    );

    return response.data.data;
  },

  async getZoneOverview(zoneId: string): Promise<ZoneOverviewResponse> {
    const response = await apiClient.get<ApiResponse<ZoneOverviewResponse>>(
      API_ENDPOINTS.IOT.FARM_ZONE_OVERVIEW(zoneId),
    );

    return response.data.data;
  },

  async getDeviceConfig(deviceId: string): Promise<DeviceConfigResponse> {
    const response = await apiClient.get<ApiResponse<DeviceConfigResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CONFIG(deviceId),
    );

    return response.data.data;
  },

  async updateDeviceConfig(
    deviceId: string,
    payload: UpdateDeviceConfigRequest,
  ): Promise<DeviceConfigResponse> {
    const response = await apiClient.put<ApiResponse<DeviceConfigResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CONFIG(deviceId),
      payload,
    );

    return response.data.data;
  },

  async pushDeviceConfig(deviceId: string): Promise<DeviceConfigResponse> {
    const response = await apiClient.post<ApiResponse<DeviceConfigResponse>>(
      API_ENDPOINTS.IOT.DEVICES.PUSH_CONFIG(deviceId),
    );

    return response.data.data;
  },
};
