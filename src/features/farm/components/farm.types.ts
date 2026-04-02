// ── Response types (match backend DTOs) ─────────────────

export type FarmPlotStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type FarmZoneStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface FarmPlotResponse {
  id: string;
  ownerProfileId: string;
  name: string;
  code: string;
  description: string;
  areaM2: number;
  addressLine: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  latitude: number | null;
  longitude: number | null;
  boundaryGeojson: Record<string, unknown> | null;
  status: FarmPlotStatus;
  createdAt: string;
  lastModifiedAt: string;
}

export interface FarmZoneResponse {
  id: string;
  farmPlotId: string;
  zoneName: string;
  zoneCode: string;
  description: string;
  areaM2: number;
  soilType: string;
  cropType: string;
  plantingDate: string;
  elevationM: number;
  boundaryGeojson: Record<string, unknown> | null;
  status: FarmZoneStatus;
  createdAt: string;
  lastModifiedAt: string;
}

// ── Request types ───────────────────────────────────────

export interface CreateFarmPlotRequest {
  ownerProfileId: string;
  name: string;
  description?: string;
  areaM2?: number;
  addressLine?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateFarmPlotRequest {
  name?: string;
  description?: string;
  areaM2?: number;
  addressLine?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  latitude?: number;
  longitude?: number;
  status?: FarmPlotStatus;
}

export interface CreateFarmZoneRequest {
  zoneName: string;
  zoneCode: string;
  description?: string;
  areaM2?: number;
  soilType?: string;
  cropType?: string;
  plantingDate?: string;
  elevationM?: number;
}

export interface UpdateFarmZoneRequest {
  zoneName?: string;
  zoneCode?: string;
  description?: string;
  areaM2?: number;
  soilType?: string;
  cropType?: string;
  plantingDate?: string;
  elevationM?: number;
  status?: FarmZoneStatus;
}
