import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import type { UpdateDeviceConfigRequest } from "../types";
import { iotKeys } from "./useDevices";

export const deviceConfigQueryOptions = (deviceId?: string) =>
  queryOptions({
    queryKey: iotKeys.deviceConfig(deviceId),
    queryFn: () => collectorApi.getDeviceConfig(deviceId as string),
    enabled: Boolean(deviceId),
    staleTime: 30_000,
  });

export const useDeviceConfig = (deviceId?: string) => {
  return useQuery(deviceConfigQueryOptions(deviceId));
};

export const useUpdateDeviceConfigMutation = (deviceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDeviceConfigRequest) =>
      collectorApi.updateDeviceConfig(deviceId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iotKeys.deviceConfig(deviceId) });
      queryClient.invalidateQueries({ queryKey: iotKeys.deviceDetail(deviceId) });
    },
  });
};

export const usePushDeviceConfigMutation = (deviceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => collectorApi.pushDeviceConfig(deviceId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iotKeys.deviceConfig(deviceId) });
      queryClient.invalidateQueries({ queryKey: iotKeys.deviceDetail(deviceId) });
    },
  });
};
