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

export type DeviceConfigSummary = {
  deviceId?: string;
  configVersion?: number;
  samplingIntervalSec?: number;
  publishIntervalSec?: number;
  offlineTimeoutSec?: number;
  alertEnabled?: boolean;
  appliedAt?: string | null;
  lastPushStatus?: string | null;
  lastAckAt?: string | null;
  lastPushError?: string | null;
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
