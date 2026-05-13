import type {
  CalendarParams,
  PageParams,
} from "../components/plant-event.types";

type RequiredPageParams = Required<PageParams>;

const DEFAULT_PAGE_PARAMS: RequiredPageParams = {
  page: 0,
  size: 20,
  sortBy: "calculatedStartDate",
  sortDir: "ASC",
};

export const withPlantEventPageDefaults = (
  params?: PageParams,
): RequiredPageParams => ({
  page: params?.page ?? DEFAULT_PAGE_PARAMS.page,
  size: params?.size ?? DEFAULT_PAGE_PARAMS.size,
  sortBy: params?.sortBy ?? DEFAULT_PAGE_PARAMS.sortBy,
  sortDir: params?.sortDir ?? DEFAULT_PAGE_PARAMS.sortDir,
});

export const plantEventKeys = {
  all: () => ["plant-events"] as const,

  lists: () => [...plantEventKeys.all(), "list"] as const,

  listByPlant: (plantId: string, params?: PageParams) =>
    [
      ...plantEventKeys.lists(),
      "plant",
      plantId,
      withPlantEventPageDefaults(params),
    ] as const,

  listByPlantAndType: (
    plantId: string,
    eventType: string,
    params?: PageParams,
  ) =>
    [
      ...plantEventKeys.lists(),
      "plant",
      plantId,
      "type",
      eventType,
      withPlantEventPageDefaults(params),
    ] as const,

  listByFarmPlot: (farmPlotId: string, params?: PageParams) =>
    [
      ...plantEventKeys.lists(),
      "farm-plot",
      farmPlotId,
      withPlantEventPageDefaults(params),
    ] as const,

  listByFarmZone: (farmZoneId: string, params?: PageParams) =>
    [
      ...plantEventKeys.lists(),
      "farm-zone",
      farmZoneId,
      withPlantEventPageDefaults(params),
    ] as const,

  listByPlan: (sourcePlanId: string, params?: PageParams) =>
    [
      ...plantEventKeys.lists(),
      "plan",
      sourcePlanId,
      withPlantEventPageDefaults(params),
    ] as const,

  listByPlanApply: (planApplyId: string, params?: PageParams) =>
    [
      ...plantEventKeys.lists(),
      "plan-apply",
      planApplyId,
      withPlantEventPageDefaults(params),
    ] as const,

  detail: (eventId: string) =>
    [...plantEventKeys.all(), "detail", eventId] as const,

  progress: (eventId: string) =>
    [...plantEventKeys.detail(eventId), "progress"] as const,

  calendar: (params: CalendarParams) =>
    [...plantEventKeys.all(), "calendar", params] as const,
};
