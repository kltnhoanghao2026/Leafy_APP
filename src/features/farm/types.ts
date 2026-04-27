export type FarmPlotStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
export type FarmZoneStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;

export type FarmPlotResponse = {
  id: string;
  ownerProfileId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  areaM2?: number | null;
  addressLine?: string | null;
  provinceCode?: string | null;
  districtCode?: string | null;
  wardCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  boundaryGeojson?: Record<string, unknown> | null;
  status?: FarmPlotStatus | null;
  createdAt?: string | null;
  lastModifiedAt?: string | null;
};

export type FarmZoneResponse = {
  id: string;
  farmPlotId: string;
  zoneName: string;
  zoneCode?: string | null;
  description?: string | null;
  areaM2?: number | null;
  soilType?: string | null;
  cropType?: string | null;
  plantingDate?: string | null;
  elevationM?: number | null;
  boundaryGeojson?: Record<string, unknown> | null;
  status?: FarmZoneStatus | null;
  createdAt?: string | null;
  lastModifiedAt?: string | null;
};
