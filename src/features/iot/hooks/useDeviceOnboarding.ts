import { useMutation, useQueryClient } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import type { ClaimDeviceRequest, ProvisionDeviceRequest } from "../types";
import { iotKeys } from "./useDevices";

export const useProvisionDeviceMutation = () => {
  return useMutation({
    mutationFn: (payload: ProvisionDeviceRequest) =>
      collectorApi.provisionDevice(payload),
  });
};

export const useGenerateClaimCodeMutation = () => {
  return useMutation({
    mutationFn: (deviceId: string) => collectorApi.generateClaimCode(deviceId),
  });
};

export const useClaimDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClaimDeviceRequest) => collectorApi.claimDevice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iotKeys.all });
    },
  });
};
