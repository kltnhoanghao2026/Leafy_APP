import { useMutation, useQueryClient } from "@tanstack/react-query";
import { plantApi } from "../api/plant.api";
import { plantKeys } from "./keys";
import type {
  PlantCreateRequest,
  PlantUpdateRequest,
} from "../components/plant.types";

export const useCreatePlantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: PlantCreateRequest) => plantApi.createPlant(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantKeys.all() });
    },
  });
};

export const useUpdatePlantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PlantUpdateRequest }) =>
      plantApi.updatePlant(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: plantKeys.all() });
      queryClient.invalidateQueries({
        queryKey: plantKeys.detail(variables.id),
      });
    },
  });
};

export const useDeletePlantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => plantApi.deletePlant(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: plantKeys.all() });
      queryClient.removeQueries({ queryKey: plantKeys.detail(id) });
    },
  });
};
