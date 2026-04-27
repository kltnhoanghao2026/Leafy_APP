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

export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CLOSED" | string;

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;

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
  latestMedia?: unknown;
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
  latestMedia?: unknown;
};
