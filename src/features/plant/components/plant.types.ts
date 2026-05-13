export type SortDirection = "ASC" | "DESC";

export type PlantStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export const PLANT_STATUS_VALUES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export type PageParams = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: SortDirection;
};

export type PageResponse<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type PlantResponse = {
  id: string;
  plantNumber: string;
  plantStatus: PlantStatus;
  nickName?: string | null;
  tagCode?: string | null;
  batchNumber?: string | null;
  sourceType?: string | null;
  motherPlantId?: string | null;
  plantingDate?: string | null;
  germinationDate?: string | null;
  actualHarvestDate?: string | null;
  totalYieldKg?: number | null;
  speciesId: string;
  farmPlotId: string;
};

export type PlantCreateRequest = {
  plantNumber?: string;
  plantStatus: PlantStatus;
  speciesId: string;
  farmPlotId: string;
  nickName?: string;
  tagCode?: string;
  batchNumber?: string;
  sourceType?: string;
  motherPlantId?: string;
  plantingDate?: string;
  germinationDate?: string;
  actualHarvestDate?: string;
  totalYieldKg?: number;
};

export type PlantUpdateRequest = Partial<PlantCreateRequest>;

export type BulkPlantStatusUpdateRequest = {
  plantIds: string[];
  newStatus: PlantStatus;
};

export type BulkPlantDeleteRequest = {
  plantIds: string[];
};

export type PlantFilterParams = {
  status?: PlantStatus | "";
  farmPlotId?: string | "";
  zoneId?: string | "";
  speciesId?: string | "";
};

export type SpeciesResponse = {
  id: string;
  commonName: string;
  cultivarName?: string | null;
  waterFrequencyDays: number;
  lightRequirements?: string | null;
  daysToMaturity?: number | null;
  plantingWindow?: string | null;
  plantingSeason?: string | null;
  idealEnv?: Record<string, unknown> | null;
  spacing?: number | null;
  expectedYieldKg?: number | null;
  commonDiseaseIds?: string[] | null;
};

export const toApiLocalDateTime = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const normalized = trimmed.replace(" ", "T");

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T00:00:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`;
  }

  return normalized;
};

export const fromApiLocalDateTime = (value?: string | null): string => {
  if (!value) return "";
  if (value.includes("T")) {
    return value.slice(0, 16);
  }
  return value.slice(0, 16);
};

export const getSpeciesLabel = (species: SpeciesResponse): string => {
  const cultivar = species.cultivarName?.trim();
  if (!cultivar) return species.commonName;
  return `${species.commonName} (${cultivar})`;
};

export const normalizePlantStatus = (value?: string | null): PlantStatus => {
  if (PLANT_STATUS_VALUES.includes(value as PlantStatus)) {
    return value as PlantStatus;
  }

  return "ACTIVE";
};
