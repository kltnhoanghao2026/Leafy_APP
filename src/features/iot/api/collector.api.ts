import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import { type ApiResponse } from "@/src/shared/api";

import type {
  DeviceDetailResponse,
  DeviceConfigResponse,
  CameraCaptureRequest,
  CameraCaptureResponse,
  DeviceMediaAnalysis,
  DeviceResponse,
  DeviceCameraSchedule,
  DeviceCameraScheduleRequest,
  DeviceMediaEvent,
  DiseaseDetectRequest,
  GenerateClaimCodeResponse,
  LatestReadingItemResponse,
  ClaimDeviceRequest,
  ChartRange,
  AlertEventDetailResponse,
  AlertEventItemResponse,
  AlertEventsParams,
  AlertRuleRequest,
  AlertRuleResponse,
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

  async getAlertRules(): Promise<AlertRuleResponse[]> {
    const response = await apiClient.get<
      ApiResponse<AlertRuleResponse[] | BackendPagedResponse<AlertRuleResponse>>
    >(API_ENDPOINTS.IOT.ALERT_RULES);
    const data = response.data.data;

    return Array.isArray(data) ? data : normalizePagedResponse(data).items;
  },

  async createAlertRule(
    payload: AlertRuleRequest,
  ): Promise<AlertRuleResponse> {
    const response = await apiClient.post<ApiResponse<AlertRuleResponse>>(
      API_ENDPOINTS.IOT.ALERT_RULES,
      payload,
    );

    return response.data.data;
  },

  async updateAlertRule(
    ruleId: string,
    payload: AlertRuleRequest,
  ): Promise<AlertRuleResponse> {
    const response = await apiClient.put<ApiResponse<AlertRuleResponse>>(
      API_ENDPOINTS.IOT.ALERT_RULE(ruleId),
      payload,
    );

    return response.data.data;
  },

  async deleteAlertRule(ruleId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.IOT.ALERT_RULE(ruleId));
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

  async getDeviceMedia(deviceId: string): Promise<DeviceMediaEvent[]> {
    const response = await apiClient.get<ApiResponse<DeviceMediaEvent[]>>(
      API_ENDPOINTS.IOT.DEVICES.MEDIA(deviceId),
    );

    return response.data.data;
  },

  async captureDeviceImage(
    deviceId: string,
    request: CameraCaptureRequest = { quality: "MEDIUM", resolution: "VGA" },
  ): Promise<CameraCaptureResponse> {
    const response = await apiClient.post<ApiResponse<CameraCaptureResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CAMERA_CAPTURE(deviceId),
      request,
    );

    return response.data.data;
  },

  async detectCameraDisease(
    deviceUid: string,
    request: DiseaseDetectRequest = { force: true },
  ): Promise<DeviceMediaAnalysis> {
    const { force, ...payload } = request;
    const response = await apiClient.post<ApiResponse<DeviceMediaAnalysis>>(
      API_ENDPOINTS.IOT.DEVICES.CAMERA_DETECT(deviceUid),
      payload,
      { params: cleanParams({ force }) },
    );

    return response.data.data;
  },

  async getDeviceCameraSchedules(
    deviceUid?: string,
  ): Promise<DeviceCameraSchedule[]> {
    if (deviceUid) {
      const response = await apiClient.get<ApiResponse<DeviceCameraSchedule[]>>(
        API_ENDPOINTS.IOT.DEVICES.CAMERA_SCHEDULES(deviceUid),
      );

      return response.data.data;
    }

    const response = await apiClient.get<ApiResponse<DeviceCameraSchedule[]>>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULES,
    );

    return response.data.data;
  },

  async createDeviceCameraSchedule(
    schedule: DeviceCameraScheduleRequest,
  ): Promise<DeviceCameraSchedule> {
    const response = await apiClient.post<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULES,
      schedule,
    );

    return response.data.data;
  },

  async createDeviceCaptureSchedule(
    deviceUid: string,
    schedule: Omit<DeviceCameraScheduleRequest, "deviceUid" | "triggerType">,
  ): Promise<DeviceCameraSchedule> {
    const response = await apiClient.post<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.DEVICES.CAMERA_SCHEDULES(deviceUid),
      schedule,
    );

    return response.data.data;
  },

  async updateDeviceCameraSchedule(
    scheduleId: string,
    updates: Partial<DeviceCameraScheduleRequest> & { deviceUid?: string },
  ): Promise<DeviceCameraSchedule> {
    if (updates.deviceUid) {
      const { deviceUid, ...payload } = updates;
      const response = await apiClient.put<ApiResponse<DeviceCameraSchedule>>(
        API_ENDPOINTS.IOT.DEVICES.CAMERA_SCHEDULE(deviceUid, scheduleId),
        payload,
      );

      return response.data.data;
    }

    const response = await apiClient.put<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULE(scheduleId),
      updates,
    );

    return response.data.data;
  },

  async deleteDeviceCameraSchedule(
    scheduleId: string,
    deviceUid?: string,
  ): Promise<void> {
    if (deviceUid) {
      await apiClient.delete<ApiResponse<void>>(
        API_ENDPOINTS.IOT.DEVICES.CAMERA_SCHEDULE(deviceUid, scheduleId),
      );
      return;
    }

    await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULE(scheduleId),
    );
  },

  async runCameraScheduleNow(
    scheduleId: string,
    deviceUid?: string,
  ): Promise<DeviceCameraSchedule> {
    if (deviceUid) {
      const response = await apiClient.post<ApiResponse<DeviceCameraSchedule>>(
        API_ENDPOINTS.IOT.DEVICES.CAMERA_SCHEDULE_RUN_NOW(deviceUid, scheduleId),
      );

      return response.data.data;
    }

    const response = await apiClient.post<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULE_RUN_NOW(scheduleId),
    );

    return response.data.data;
  },

  async runScheduledCameraForDevice(
    deviceUid: string,
  ): Promise<DeviceCameraSchedule> {
    const response = await apiClient.post<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.ADMIN_CAMERA_RUN_SCHEDULED(deviceUid),
    );

    return response.data.data;
  },
};
