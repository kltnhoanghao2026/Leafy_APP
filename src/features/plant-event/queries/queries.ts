import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { plantEventApi } from "../api/plant-event.api";
import { plantEventKeys, withPlantEventPageDefaults } from "./keys";
import type {
  CalendarParams,
  PageParams,
} from "../components/plant-event.types";

export type PlantEventPageParams = PageParams & {
  eventType?: string;
  planApplyId?: string;
};

export const usePlantEventsByPlant = (
  plantId: string,
  params?: PlantEventPageParams
) => {
  const resolvedParams = withPlantEventPageDefaults(params);

  return useQuery({
    queryKey: plantEventKeys.listByPlant(plantId, resolvedParams),
    queryFn: () => plantEventApi.getEventsByPlant(plantId, resolvedParams),
    select: (response) => response.data.data,
    enabled: !!plantId,
  });
};

export const usePlantEventsByPlantAndType = (
  plantId: string,
  eventType: string,
  params?: PageParams,
) => {
  const resolvedParams = withPlantEventPageDefaults(params);

  return useQuery({
    queryKey: plantEventKeys.listByPlantAndType(
      plantId,
      eventType,
      resolvedParams,
    ),
    queryFn: () =>
      plantEventApi.getEventsByPlantAndType(plantId, eventType, resolvedParams),
    select: (response) => response.data.data,
    enabled: !!plantId && !!eventType,
  });
};

export const usePlantEventById = (eventId: string, refetchInterval?: number) =>
  useQuery({
    queryKey: plantEventKeys.detail(eventId),
    queryFn: () => plantEventApi.getEventById(eventId),
    select: (response) => response.data.data,
    enabled: !!eventId,
    refetchInterval: refetchInterval,
    refetchIntervalInBackground: false,
  });

export const usePlantEventsByFarmPlot = (
  farmPlotId: string,
  params?: PlantEventPageParams
) => {
  const resolvedParams = withPlantEventPageDefaults(params);

  return useQuery({
    queryKey: plantEventKeys.listByFarmPlot(farmPlotId, resolvedParams),
    queryFn: () =>
      plantEventApi.getEventsByFarmPlot(farmPlotId, resolvedParams),
    select: (response) => response.data.data,
    enabled: !!farmPlotId,
  });
};

export const usePlantEventsByFarmZone = (
  farmZoneId: string,
  params?: PlantEventPageParams
) => {
  const resolvedParams = withPlantEventPageDefaults(params);

  return useQuery({
    queryKey: plantEventKeys.listByFarmZone(farmZoneId, resolvedParams),
    queryFn: () =>
      plantEventApi.getEventsByFarmZone(farmZoneId, resolvedParams),
    select: (response) => response.data.data,
    enabled: !!farmZoneId,
  });
};

export const usePlantEventsByPlan = (
  sourcePlanId: string,
  params?: PageParams,
) => {
  const resolvedParams = withPlantEventPageDefaults(params);

  return useQuery({
    queryKey: plantEventKeys.listByPlan(sourcePlanId, resolvedParams),
    queryFn: () =>
      plantEventApi.getEventsByPlan(sourcePlanId, resolvedParams),
    select: (response) => response.data.data,
    enabled: !!sourcePlanId,
  });
};

export const usePlantEventsByPlanApply = (
  planApplyId: string,
  params?: PageParams,
) => {
  const resolvedParams = withPlantEventPageDefaults(params);

  return useQuery({
    queryKey: plantEventKeys.listByPlanApply(planApplyId, resolvedParams),
    queryFn: () =>
      plantEventApi.getEventsByPlanApply(planApplyId, resolvedParams),
    select: (response) => response.data.data,
    enabled: !!planApplyId,
  });
};

export const usePlantEventsCalendar = (params: CalendarParams) =>
  useQuery({
    queryKey: plantEventKeys.calendar(params),
    queryFn: () => plantEventApi.getEventsForCalendar(params),
    select: (response) => response.data.data,
    enabled: Boolean(params.startDate && params.endDate),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useEventProgress = (
  eventId: string,
  params?: PageParams,
  enabled = true,
) =>
  useQuery({
    queryKey: plantEventKeys.progress(eventId),
    queryFn: () => plantEventApi.getEventProgress(eventId, params),
    select: (response) => response.data.data,
    enabled: enabled && !!eventId,
  });

export const usePlantEventPresignedUrl = (fileId: string, enabled = true) =>
  useQuery({
    queryKey: [...plantEventKeys.all(), "presigned", fileId],
    queryFn: () => plantEventApi.getPresignedUrl(fileId),
    select: (response) => response.data.data,
    enabled: enabled && !!fileId,
    staleTime: 60 * 60 * 1000,
  });
