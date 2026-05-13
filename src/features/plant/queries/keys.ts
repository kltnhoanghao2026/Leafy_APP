import type { PageParams, PlantFilterParams } from "../components/plant.types";

type RequiredPageParams = Required<PageParams>;

const DEFAULT_PAGE_PARAMS: RequiredPageParams = {
  page: 0,
  size: 20,
  sortBy: "createdAt",
  sortDir: "DESC",
};

export const withPlantPageDefaults = <T extends PageParams>(
  params?: T,
): T & RequiredPageParams => ({
  ...(params as any),
  page: params?.page ?? DEFAULT_PAGE_PARAMS.page,
  size: params?.size ?? DEFAULT_PAGE_PARAMS.size,
  sortBy: params?.sortBy ?? DEFAULT_PAGE_PARAMS.sortBy,
  sortDir: params?.sortDir ?? DEFAULT_PAGE_PARAMS.sortDir,
});

export const plantKeys = {
  all: () => ["plants"] as const,

  lists: () => [...plantKeys.all(), "list"] as const,
  list: (params?: PageParams & PlantFilterParams) =>
    [...plantKeys.lists(), withPlantPageDefaults(params)] as const,
  listByFarmPlot: (farmPlotId: string, params?: PageParams & PlantFilterParams) =>
    [
      ...plantKeys.lists(),
      "farm-plot",
      farmPlotId,
      withPlantPageDefaults(params),
    ] as const,

  detail: (id: string) => [...plantKeys.all(), "detail", id] as const,

  species: (params?: PageParams) =>
    ["species", withPlantPageDefaults(params)] as const,
};
