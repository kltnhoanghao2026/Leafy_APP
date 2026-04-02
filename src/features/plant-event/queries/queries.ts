import { useQuery } from "@tanstack/react-query";
import { plantEventApi } from "../api/plant-event.api";
import { plantEventKeys, withPlantEventPageDefaults } from "./keys";
import type { PageParams } from "../components/plant-event.types";

export const usePlantEventsByPlant = (plantId: string, params?: PageParams) => {
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

export const usePlantEventById = (eventId: string) =>
  useQuery({
    queryKey: plantEventKeys.detail(eventId),
    queryFn: () => plantEventApi.getEventById(eventId),
    select: (response) => response.data.data,
    enabled: !!eventId,
  });

export const usePlantEventsByFarmPlot = (
  farmPlotId: string,
  params?: PageParams,
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
  params?: PageParams,
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
