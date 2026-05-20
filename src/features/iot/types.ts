export type DeviceStatus =
  | "ONLINE"
  | "OFFLINE"
  | "DISABLED"
  | "MAINTENANCE"
  | "ERROR"
  | "PENDING"
  | "UNKNOWN"
  | string;

export type ProvisioningStatus =
  | "PENDING"
  | "PROVISIONED"
  | "CLAIMED"
  | "DISABLED"
  | "UNCLAIMED"
  | string;

export type SortDirection = "asc" | "desc";

export type ChartRange = "H24" | "D3" | "D7" | "D30" | "D90";

export type SensorCode =
  | "AIR_TEMP"
  | "AIR_HUMIDITY"
  | "SOIL_MOISTURE"
  | "LIGHT_INTENSITY"
  | string;

export type DeviceConfigPushStatus =
  | "PENDING"
  | "SENT"
  | "ACKED"
  | "FAILED"
  | string;

export type DeviceMediaEventStatus =
  | "REQUESTED"
  | "COMMAND_SENT"
  | "UPLOADING"
  | "UPLOADED"
  | "FAILED"
  | "TIMEOUT"
  | string;

export type CameraCaptureQuality = "LOW" | "MEDIUM" | "HIGH" | string;

export type CameraCaptureResolution = "QVGA" | "VGA" | "HD" | string;

export type CameraScheduleRecurrence = "DAILY" | "WEEKLY" | "MONTHLY" | string;

export type CameraScheduleTriggerType = "MANUAL" | "SCHEDULED" | string;

export type DeviceCameraScheduleStatus =
  | "ENABLED"
  | "DISABLED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | string;

export type DeviceMediaAnalysisStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "DISEASE_DETECTED"
  | "FAILED"
  | string;

export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CLOSED" | string;

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;

export type AlertRuleStatus = "ENABLED" | "DISABLED" | string;

export type MyDevicesParams = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: SortDirection;
  keyword?: string;
  status?: DeviceStatus;
  provisioningStatus?: ProvisioningStatus;
  zoneId?: string;
  farmPlotId?: string;
};

export type AlertEventsParams = {
  zoneId?: string;
  deviceId?: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sortBy?: "openedAt" | "severity" | "status" | string;
  sortDir?: SortDirection;
};

export type PagedResponse<T> = {
  items: T[];
  content?: T[];
  page: number;
  size: number;
  totalItems: number;
  totalElements?: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  first?: boolean;
  last?: boolean;
};

export type DeviceResponse = {
  id: string;
  deviceUid: string;
  deviceCode: string;
  deviceName?: string | null;
  deviceType?: string | null;
  firmwareVersion?: string | null;
  isActive?: boolean | null;
  status: DeviceStatus;
  provisioningStatus: ProvisioningStatus;
  ownerUserId?: string | null;
  farmPlotId?: string | null;
  zoneId?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ProvisionDeviceRequest = {
  deviceUid: string;
  deviceCode: string;
  deviceName?: string;
  deviceType: string;
};

export type GenerateClaimCodeResponse = {
  deviceId: string;
  claimCode: string;
  expiresAt?: string | null;
};

export type ClaimDeviceRequest = {
  deviceUid: string;
  claimCode: string;
  farmPlotId: string;
  zoneId: string;
};

export type DeviceQrPayload = {
  deviceUid: string;
  deviceCode: string;
  deviceType: string;
  model?: string;
};

export type LatestReadingItemResponse = {
  sensorTypeId?: string | null;
  sensorCode: string;
  sensorName?: string | null;
  unit?: string | null;
  value: number;
  readingTime?: string | null;
  qualityStatus?: string | null;
  status?: string | null;
  severity?: string | null;
};

export type SensorChartPointResponse = {
  bucketStart?: string | null;
  bucketEnd?: string | null;
  timestamp?: string | null;
  value?: number | null;
  avgValue?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  sampleCount?: number | null;
};

export type SensorChartResponse = {
  deviceId?: string | null;
  zoneId?: string | null;
  sensorCode: SensorCode;
  sensorName?: string | null;
  unit?: string | null;
  rangeType?: ChartRange | string | null;
  range?: ChartRange | string | null;
  points: SensorChartPointResponse[];
};

export type DeviceMediaAnalysis = {
  id: string;
  mediaEventId: string;
  alertEventId?: string | null;
  fileId: string;
  deviceUid: string;
  requestId?: string | null;
  triggerType?: CameraScheduleTriggerType | string | null;
  status: DeviceMediaAnalysisStatus;
  analysisStatus?: DeviceMediaAnalysisStatus | string | null;
  diseaseDetected?: boolean | null;
  severity?: AlertSeverity | string | null;
  diseaseType?: string | null;
  diseaseName?: string | null;
  confidence?: number | null;
  notes?: string | null;
  fileUrl?: string | null;
  capturedAt?: string | null;
  analyzedAt?: string | null;
  timestamp?: string | null;
  error?: string | null;
};

export type DeviceMediaEvent = {
  id: string;
  requestId?: string | null;
  deviceId?: string | null;
  deviceUid?: string | null;
  zoneId?: string | null;
  fileId?: string | null;
  fileUrl?: string | null;
  mediaType?: string | null;
  triggerType?: CameraScheduleTriggerType | string | null;
  status: DeviceMediaEventStatus;
  contentType?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  resolution?: CameraCaptureResolution | string | null;
  quality?: CameraCaptureQuality | string | null;
  uploadEndpoint?: string | null;
  requestedAt?: string | null;
  commandSentAt?: string | null;
  uploadedAt?: string | null;
  capturedAt?: string | null;
  timestamp?: string | null;
  error?: string | null;
  analysis?: DeviceMediaAnalysis | null;
};

export type CameraCaptureRequest = {
  quality?: CameraCaptureQuality;
  resolution?: CameraCaptureResolution;
};

export type CameraCaptureResponse = {
  requestId: string;
  deviceId: string;
  deviceUid?: string | null;
  status: DeviceMediaEventStatus;
  requestedAt?: string | null;
  timestamp?: string | null;
};

export type DiseaseDetectRequest = {
  mediaEventId?: string;
  fileId?: string;
  fileUrl?: string;
  deviceUid?: string;
  force?: boolean;
};

export type DeviceCameraScheduleRequest = {
  deviceUid?: string;
  enabled?: boolean;
  triggerType?: CameraScheduleTriggerType;
  timeOfDay: string;
  recurrence: CameraScheduleRecurrence;
  resolution?: CameraCaptureResolution;
  quality?: CameraCaptureQuality;
  uploadEndpoint?: string;
};

export type DeviceCameraSchedule = {
  scheduleId: string;
  id?: string;
  deviceId?: string | null;
  deviceUid: string;
  enabled: boolean;
  triggerType: CameraScheduleTriggerType;
  status?: DeviceCameraScheduleStatus | null;
  timeOfDay: string;
  recurrence: CameraScheduleRecurrence;
  resolution?: CameraCaptureResolution | string | null;
  quality?: CameraCaptureQuality | string | null;
  uploadEndpoint?: string | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastMediaEvent?: DeviceMediaEvent | null;
};

export type DeviceCameraScheduleResponse = DeviceCameraSchedule;

export type DashboardOverviewResponse = {
  farmPlotId: string;
  totalDevices?: number;
  onlineDevices?: number;
  offlineDevices?: number;
  totalZones?: number;
  openAlerts?: number;
  latestReadings?: LatestReadingItemResponse[];
  latestAlertAt?: string | null;
  lastUpdatedAt?: string | null;
};

export type ZoneOverviewResponse = {
  zoneId: string;
  deviceCount?: number;
  onlineDeviceCount?: number;
  offlineDeviceCount?: number;
  openAlertCount?: number;
  openAlerts?: number;
  latestReadings?: LatestReadingItemResponse[];
  alertSummary?: AlertSummary | null;
  latestMedia?: DeviceMediaEvent | null;
  latestAlertAt?: string | null;
  lastUpdatedAt?: string | null;
};

export type AlertEventItemResponse = {
  id: string;
  deviceId?: string | null;
  deviceName?: string | null;
  zoneId?: string | null;
  farmPlotId?: string | null;
  sensorTypeId?: string | null;
  sensorCode?: string | null;
  sensorName?: string | null;
  alertRuleId?: string | null;
  ruleId?: string | null;
  alertType?: string | null;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggerValue?: number | null;
  readingValue?: number | null;
  thresholdMin?: number | null;
  thresholdMax?: number | null;
  unit?: string | null;
  openedAt?: string | null;
  triggeredAt?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  createdAt?: string | null;
  pushSent?: boolean | null;
};

export type AlertEventDetailResponse = AlertEventItemResponse;

export type AlertRule = {
  ruleId: string;
  id?: string;
  name?: string | null;
  sensorType: string;
  sensorTypeId?: string | null;
  deviceId?: string | null;
  zoneId?: string | null;
  farmPlotId?: string | null;
  ownerUserId?: string | null;
  thresholdMin?: number | null;
  thresholdMax?: number | null;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  severity: AlertSeverity;
  enabled: boolean;
  status?: AlertRuleStatus | null;
  cooldownMinutes?: number | null;
  notifyWeb?: boolean | null;
  notifyMobile?: boolean | null;
  lastTriggeredAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AlertRuleResponse = AlertRule;

export type AlertRuleRequest = {
  name?: string | null;
  sensorType?: string;
  sensorTypeId?: string;
  deviceId?: string | null;
  zoneId?: string | null;
  farmPlotId?: string | null;
  thresholdMin?: number | null;
  thresholdMax?: number | null;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  severity: AlertSeverity;
  enabled?: boolean;
  cooldownMinutes?: number | null;
  notifyWeb?: boolean;
  notifyMobile?: boolean;
};

export type DeviceConfigSummary = {
  deviceId?: string;
  configVersion?: number;
  samplingIntervalSec?: number;
  publishIntervalSec?: number;
  offlineTimeoutSec?: number;
  alertEnabled?: boolean;
  appliedAt?: string | null;
  lastPushStatus?: DeviceConfigPushStatus | null;
  lastAckAt?: string | null;
  lastPushError?: string | null;
};

export type DeviceConfigResponse = {
  deviceId: string;
  configVersion: number;
  samplingIntervalSec: number;
  publishIntervalSec: number;
  offlineTimeoutSec: number;
  alertEnabled: boolean;
  appliedAt?: string | null;
  lastPushStatus?: DeviceConfigPushStatus | null;
  lastAckAt?: string | null;
  lastPushError?: string | null;
};

export type UpdateDeviceConfigRequest = {
  samplingIntervalSec: number;
  publishIntervalSec: number;
  offlineTimeoutSec: number;
  alertEnabled: boolean;
};

export type AlertSummary = {
  totalOpen?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
  [key: string]: unknown;
};

export type DeviceDetailResponse = {
  id?: string;
  deviceId?: string;
  deviceUid: string;
  deviceCode: string;
  deviceName?: string | null;
  deviceType?: string | null;
  firmwareVersion?: string | null;
  isActive?: boolean | null;
  status: DeviceStatus;
  provisioningStatus: ProvisioningStatus;
  ownerUserId?: string | null;
  farmPlotId?: string | null;
  zoneId?: string | null;
  lastSeenAt?: string | null;
  latestReadings?: LatestReadingItemResponse[];
  config?: DeviceConfigSummary | null;
  alertSummary?: AlertSummary | null;
  latestMedia?: DeviceMediaEvent | null;
};
