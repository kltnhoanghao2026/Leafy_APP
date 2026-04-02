import { useMutation, useQueryClient } from "@tanstack/react-query";
import { plantEventApi } from "../api/plant-event.api";
import { plantEventKeys } from "./keys";
import type {
  PlantEventCreateRequest,
  PlantEventUpdateRequest,
} from "../components/plant-event.types";

export const useCreatePlantEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: PlantEventCreateRequest) =>
      plantEventApi.createEvent(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantEventKeys.all() });
    },
  });
};

export const useUpdatePlantEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      body,
    }: {
      eventId: string;
      body: PlantEventUpdateRequest;
    }) => plantEventApi.updateEvent(eventId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: plantEventKeys.all() });
      queryClient.invalidateQueries({
        queryKey: plantEventKeys.detail(variables.eventId),
      });
    },
  });
};

export const useDeletePlantEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => plantEventApi.deleteEvent(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: plantEventKeys.all() });
      queryClient.removeQueries({
        queryKey: plantEventKeys.detail(eventId),
      });
    },
  });
};
