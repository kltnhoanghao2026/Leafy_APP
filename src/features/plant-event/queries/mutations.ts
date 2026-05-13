import { useMutation, useQueryClient } from "@tanstack/react-query";
import { plantEventApi } from "../api/plant-event.api";
import { plantEventKeys } from "./keys";
import type {
  PlantEventCreateRequest,
  PlantEventUpdateRequest,
  EventProgressUpdateRequest,
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
      queryClient.invalidateQueries({
        queryKey: [...plantEventKeys.detail(variables.eventId), "progress"],
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

export const useToggleTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      taskIndex,
    }: {
      eventId: string;
      taskIndex: number;
    }) => plantEventApi.toggleTask(eventId, taskIndex),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: plantEventKeys.detail(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: plantEventKeys.all(),
      });
    },
  });
};

export const useUpdateEventProgressMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      progressId,
      body,
    }: {
      eventId: string;
      progressId: string;
      body: EventProgressUpdateRequest;
    }) => plantEventApi.updateEventProgress(eventId, progressId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: plantEventKeys.progress(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: plantEventKeys.detail(variables.eventId),
      });
      // Also invalidate calendar queries so completed progress reflects on calendar
      queryClient.invalidateQueries({
        queryKey: [...plantEventKeys.all(), "calendar"],
      });
    },
  });
};

export const useGenerateEventProgressMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) =>
      plantEventApi.generateEventProgress(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({
        queryKey: plantEventKeys.progress(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: plantEventKeys.detail(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: [...plantEventKeys.all(), "calendar"],
      });
    },
  });
};
