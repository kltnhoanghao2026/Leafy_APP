import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { plantApi } from "../api/plant.api";
import { plantKeys, withPlantPageDefaults } from "./keys";
import type { PageParams, PlantFilterParams } from "../components/plant.types";

export const usePlants = (params?: PageParams & PlantFilterParams, enabled = true) => {
  const resolvedParams = withPlantPageDefaults(params);

  return useQuery({
    queryKey: plantKeys.list(resolvedParams),
    queryFn: () => plantApi.getPlants(resolvedParams),
    select: (response) => response.data.data,
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const usePlantsByFarmPlot = (
  farmPlotId: string,
  params?: PageParams & PlantFilterParams,
) => {
  const resolvedParams = withPlantPageDefaults(params);

  return useQuery({
    queryKey: plantKeys.listByFarmPlot(farmPlotId, resolvedParams),
    queryFn: () => plantApi.getPlantsByFarmPlot(farmPlotId, resolvedParams),
    select: (response) => response.data.data,
    enabled: !!farmPlotId,
    placeholderData: keepPreviousData,
  });
};

export const usePlantById = (id: string) =>
  useQuery({
    queryKey: plantKeys.detail(id),
    queryFn: () => plantApi.getPlantById(id),
    select: (response) => response.data.data,
    enabled: !!id,
  });

export const useSpecies = (params?: PageParams) => {
  const resolvedParams = withPlantPageDefaults({
    page: 0,
    size: 100,
    sortBy: "commonName",
    sortDir: "ASC",
    ...params,
  });

  return useQuery({
    queryKey: plantKeys.species(resolvedParams),
    queryFn: () => plantApi.getSpecies(resolvedParams),
    select: (response) => response.data.data,
  });
};
