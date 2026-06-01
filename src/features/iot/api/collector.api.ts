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
  ConnectDeviceRequest,
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
  UpdateDeviceRequest,
  ZoneOverviewResponse,
} from "../types";

type BackendPagedResponse<T> = PagedResponse<T> & {
  content?: T[];
  totalElements?: number;
};

const unwrapResponseData = <T>(response: ApiResponse<T> | T): T => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    ("code" in response || "message" in response) &&
    (response as ApiResponse<T>).data !== undefined
  ) {
    return (response as ApiResponse<T>).data;
  }

  return response as T;
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
  response: BackendPagedResponse<T> | T[] | null | undefined,
): PagedResponse<T> => {
  if (Array.isArray(response)) {
    return {
      items: response,
      content: response,
      page: 0,
      size: response.length,
      totalItems: response.length,
      totalElements: response.length,
      totalPages: response.length ? 1 : 0,
      hasNext: false,
      hasPrevious: false,
    };
  }

  const pageResponse = response ?? ({} as BackendPagedResponse<T>);
  const items = Array.isArray(pageResponse.items)
    ? pageResponse.items
    : Array.isArray(pageResponse.content)
      ? pageResponse.content
      : [];
  const totalItems =
    pageResponse.totalItems ?? pageResponse.totalElements ?? items.length;

  return {
    ...pageResponse,
    items,
    content: pageResponse.content ?? items,
    totalItems,
    totalElements: pageResponse.totalElements ?? totalItems,
    page: pageResponse.page ?? 0,
    size: pageResponse.size ?? items.length,
    totalPages: pageResponse.totalPages ?? (items.length ? 1 : 0),
    hasNext: pageResponse.hasNext ?? false,
    hasPrevious: pageResponse.hasPrevious ?? false,
  };
};

const normalizeDeviceDetail = (
  detail: DeviceDetailResponse,
): DeviceDetailResponse => ({
  ...detail,
  id: detail.id ?? detail.deviceId,
  latestMedia: detail.latestMedia
    ? {
        ...detail.latestMedia,
        id: detail.latestMedia.id ?? detail.latestMedia.mediaEventId,
        status: detail.latestMedia.status ?? "UPLOADED",
      }
    : detail.latestMedia,
});

const isNotFoundError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as { response?: { status?: number }; message?: string };
  return maybeError.response?.status === 404 || maybeError.message?.includes("404") === true;
};

export const collectorApi = {
  async getMyDevices(
    params?: MyDevicesParams,
  ): Promise<PagedResponse<DeviceResponse>> {
    const response = await apiClient.get<ApiResponse<BackendPagedResponse<DeviceResponse>>>(
      API_ENDPOINTS.IOT.DEVICES.ME,
      { params: cleanParams(params) },
    );

    return normalizePagedResponse(unwrapResponseData(response.data));
  },

  async getAlertEvents(
    params?: AlertEventsParams,
  ): Promise<PagedResponse<AlertEventItemResponse>> {
    const response = await apiClient.get<ApiResponse<BackendPagedResponse<AlertEventItemResponse>>>(
      API_ENDPOINTS.IOT.ALERT_EVENTS,
      { params: cleanParams(params) },
    );

    return normalizePagedResponse(unwrapResponseData(response.data));
  },

  async getAlertEventById(alertId: string): Promise<AlertEventDetailResponse> {
    const response = await apiClient.get<ApiResponse<AlertEventDetailResponse>>(
      API_ENDPOINTS.IOT.ALERT_EVENT(alertId),
    );

    return unwrapResponseData(response.data);
  },

  async acknowledgeAlert(alertId: string): Promise<AlertEventDetailResponse> {
    const response = await apiClient.post<ApiResponse<AlertEventDetailResponse>>(
      API_ENDPOINTS.IOT.ALERT_EVENT_ACKNOWLEDGE(alertId),
    );

    return unwrapResponseData(response.data);
  },

  async resolveAlert(alertId: string): Promise<AlertEventDetailResponse> {
    const response = await apiClient.post<ApiResponse<AlertEventDetailResponse>>(
      API_ENDPOINTS.IOT.ALERT_EVENT_RESOLVE(alertId),
    );

    return unwrapResponseData(response.data);
  },

  async getAlertRules(): Promise<AlertRuleResponse[]> {
    const response = await apiClient.get<
      ApiResponse<AlertRuleResponse[] | BackendPagedResponse<AlertRuleResponse>>
    >(API_ENDPOINTS.IOT.ALERT_RULES);
    const data = unwrapResponseData(response.data);

    return Array.isArray(data) ? data : normalizePagedResponse(data).items;
  },

  async createAlertRule(
    payload: AlertRuleRequest,
  ): Promise<AlertRuleResponse> {
    const response = await apiClient.post<ApiResponse<AlertRuleResponse>>(
      API_ENDPOINTS.IOT.ALERT_RULES,
      payload,
    );

    return unwrapResponseData(response.data);
  },

  async updateAlertRule(
    ruleId: string,
    payload: AlertRuleRequest,
  ): Promise<AlertRuleResponse> {
    const response = await apiClient.put<ApiResponse<AlertRuleResponse>>(
      API_ENDPOINTS.IOT.ALERT_RULE(ruleId),
      payload,
    );

    return unwrapResponseData(response.data);
  },

  async deleteAlertRule(ruleId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.IOT.ALERT_RULE(ruleId));
  },

  async getDeviceDetail(deviceId: string): Promise<DeviceDetailResponse> {
    const response = await apiClient.get<ApiResponse<DeviceDetailResponse>>(
      API_ENDPOINTS.IOT.DEVICES.DETAIL(deviceId),
    );

    return normalizeDeviceDetail(unwrapResponseData(response.data));
  },

  async updateDevice(
    deviceId: string,
    payload: UpdateDeviceRequest,
  ): Promise<DeviceResponse> {
    const response = await apiClient.patch<ApiResponse<DeviceResponse>>(
      API_ENDPOINTS.IOT.DEVICES.ITEM(deviceId),
      payload,
    );

    return unwrapResponseData(response.data);
  },

  async releaseDevice(deviceId: string): Promise<DeviceResponse> {
    const response = await apiClient.post<ApiResponse<DeviceResponse>>(
      API_ENDPOINTS.IOT.DEVICES.RELEASE(deviceId),
    );

    return unwrapResponseData(response.data);
  },

  async getDeviceLatestReadings(
    deviceId: string,
  ): Promise<LatestReadingItemResponse[]> {
    const response = await apiClient.get<ApiResponse<LatestReadingItemResponse[]>>(
      API_ENDPOINTS.IOT.DEVICES.LATEST_READINGS(deviceId),
    );

    return unwrapResponseData(response.data);
  },

  async provisionDevice(
    payload: ProvisionDeviceRequest,
  ): Promise<DeviceResponse> {
    const response = await apiClient.post<ApiResponse<DeviceResponse>>(
      API_ENDPOINTS.IOT.DEVICES.PROVISION,
      payload,
    );

    return unwrapResponseData(response.data);
  },

  async connectDevice(payload: ConnectDeviceRequest): Promise<DeviceResponse> {
    try {
      const response = await apiClient.post<ApiResponse<DeviceResponse>>(
        API_ENDPOINTS.IOT.DEVICES.CONNECT,
        payload,
      );

      return unwrapResponseData(response.data);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      const provisioned = await collectorApi.provisionDevice(payload);
      const claimCode = await collectorApi.generateClaimCode(provisioned.id);
      return collectorApi.claimDevice({
        deviceUid: provisioned.deviceUid,
        claimCode: claimCode.claimCode,
        farmPlotId: payload.farmPlotId,
        zoneId: payload.zoneId,
      });
    }
  },

  async generateClaimCode(
    deviceId: string,
  ): Promise<GenerateClaimCodeResponse> {
    const response = await apiClient.post<ApiResponse<GenerateClaimCodeResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CLAIM_CODE(deviceId),
    );

    return unwrapResponseData(response.data);
  },

  async claimDevice(payload: ClaimDeviceRequest): Promise<DeviceResponse> {
    const response = await apiClient.post<ApiResponse<DeviceResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CLAIM,
      payload,
    );

    return unwrapResponseData(response.data);
  },

  async getDeviceChart(
    deviceId: string,
    params: { sensorCode: SensorCode; range: ChartRange },
  ): Promise<SensorChartResponse> {
    const response = await apiClient.get<ApiResponse<SensorChartResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CHARTS(deviceId),
      { params },
    );

    return unwrapResponseData(response.data);
  },

  async getZoneChart(
    zoneId: string,
    params: { sensorCode: SensorCode; range: ChartRange },
  ): Promise<SensorChartResponse> {
    const response = await apiClient.get<ApiResponse<SensorChartResponse>>(
      API_ENDPOINTS.IOT.FARM_ZONE_CHARTS(zoneId),
      { params },
    );

    return unwrapResponseData(response.data);
  },

  async getDashboardOverview(
    farmPlotId: string,
  ): Promise<DashboardOverviewResponse> {
    const response = await apiClient.get<ApiResponse<DashboardOverviewResponse>>(
      API_ENDPOINTS.IOT.DASHBOARD_OVERVIEW,
      { params: { farmPlotId } },
    );

    return unwrapResponseData(response.data);
  },

  async getZoneOverview(zoneId: string): Promise<ZoneOverviewResponse> {
    const response = await apiClient.get<ApiResponse<ZoneOverviewResponse>>(
      API_ENDPOINTS.IOT.FARM_ZONE_OVERVIEW(zoneId),
    );

    return unwrapResponseData(response.data);
  },

  async getDeviceConfig(deviceId: string): Promise<DeviceConfigResponse> {
    const response = await apiClient.get<ApiResponse<DeviceConfigResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CONFIG(deviceId),
    );

    return unwrapResponseData(response.data);
  },

  async updateDeviceConfig(
    deviceId: string,
    payload: UpdateDeviceConfigRequest,
  ): Promise<DeviceConfigResponse> {
    const response = await apiClient.put<ApiResponse<DeviceConfigResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CONFIG(deviceId),
      payload,
    );

    return unwrapResponseData(response.data);
  },

  async pushDeviceConfig(deviceId: string): Promise<DeviceConfigResponse> {
    const response = await apiClient.post<ApiResponse<DeviceConfigResponse>>(
      API_ENDPOINTS.IOT.DEVICES.PUSH_CONFIG(deviceId),
    );

    return unwrapResponseData(response.data);
  },

  async getDeviceMedia(deviceId: string): Promise<DeviceMediaEvent[]> {
    const response = await apiClient.get<ApiResponse<DeviceMediaEvent[]>>(
      API_ENDPOINTS.IOT.DEVICES.MEDIA(deviceId),
    );

    return unwrapResponseData(response.data);
  },

  async captureDeviceImage(
    deviceId: string,
    request: CameraCaptureRequest = { quality: "MEDIUM", resolution: "VGA" },
  ): Promise<CameraCaptureResponse> {
    const response = await apiClient.post<ApiResponse<CameraCaptureResponse>>(
      API_ENDPOINTS.IOT.DEVICES.CAMERA_CAPTURE(deviceId),
      request,
    );

    return unwrapResponseData(response.data);
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

    return unwrapResponseData(response.data);
  },

  async getDeviceCameraSchedules(
    deviceUid?: string,
  ): Promise<DeviceCameraSchedule[]> {
    if (deviceUid) {
      const response = await apiClient.get<ApiResponse<DeviceCameraSchedule[]>>(
        API_ENDPOINTS.IOT.DEVICES.CAMERA_SCHEDULES(deviceUid),
      );

      return unwrapResponseData(response.data);
    }

    const response = await apiClient.get<ApiResponse<DeviceCameraSchedule[]>>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULES,
    );

    return unwrapResponseData(response.data);
  },

  async createDeviceCameraSchedule(
    schedule: DeviceCameraScheduleRequest,
  ): Promise<DeviceCameraSchedule> {
    const response = await apiClient.post<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULES,
      schedule,
    );

    return unwrapResponseData(response.data);
  },

  async createDeviceCaptureSchedule(
    deviceUid: string,
    schedule: Omit<DeviceCameraScheduleRequest, "deviceUid" | "triggerType">,
  ): Promise<DeviceCameraSchedule> {
    const response = await apiClient.post<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.DEVICES.CAMERA_SCHEDULES(deviceUid),
      schedule,
    );

    return unwrapResponseData(response.data);
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

      return unwrapResponseData(response.data);
    }

    const response = await apiClient.put<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULE(scheduleId),
      updates,
    );

    return unwrapResponseData(response.data);
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

      return unwrapResponseData(response.data);
    }

    const response = await apiClient.post<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.CAMERA_SCHEDULE_RUN_NOW(scheduleId),
    );

    return unwrapResponseData(response.data);
  },

  async runScheduledCameraForDevice(
    deviceUid: string,
  ): Promise<DeviceCameraSchedule> {
    const response = await apiClient.post<ApiResponse<DeviceCameraSchedule>>(
      API_ENDPOINTS.IOT.ADMIN_CAMERA_RUN_SCHEDULED(deviceUid),
    );

    return unwrapResponseData(response.data);
  },
};
