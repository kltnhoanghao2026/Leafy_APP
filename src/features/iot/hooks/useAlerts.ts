import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import type { AlertEventsParams, AlertEventItemResponse } from "../types";
import { iotKeys } from "./useDevices";

export const alertEventsQueryOptions = (params?: AlertEventsParams) =>
  queryOptions({
    queryKey: iotKeys.alerts(params),
    queryFn: () => collectorApi.getAlertEvents(params),
    staleTime: 30_000,
  });

export const alertEventDetailQueryOptions = (alertId?: string) =>
  queryOptions({
    queryKey: iotKeys.alertDetail(alertId),
    queryFn: () => collectorApi.getAlertEventById(alertId as string),
    enabled: Boolean(alertId),
    staleTime: 30_000,
  });

const invalidateAlertSideEffects = (
  queryClient: ReturnType<typeof useQueryClient>,
  alert?: AlertEventItemResponse,
) => {
  queryClient.invalidateQueries({ queryKey: iotKeys.alerts() });
  queryClient.invalidateQueries({ queryKey: iotKeys.alertDetail(alert?.id) });
  queryClient.invalidateQueries({ queryKey: iotKeys.all });

  if (alert?.zoneId) {
    queryClient.invalidateQueries({ queryKey: iotKeys.zoneOverview(alert.zoneId) });
  }

  if (alert?.deviceId) {
    queryClient.invalidateQueries({ queryKey: iotKeys.deviceDetail(alert.deviceId) });
  }
};

export const useAlertEvents = (params?: AlertEventsParams) => {
  return useQuery(alertEventsQueryOptions(params));
};

export const useAlertEventDetail = (alertId?: string) => {
  return useQuery(alertEventDetailQueryOptions(alertId));
};

export const useAcknowledgeAlertMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => collectorApi.acknowledgeAlert(alertId),
    onSuccess: (alert) => invalidateAlertSideEffects(queryClient, alert),
  });
};

export const useResolveAlertMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => collectorApi.resolveAlert(alertId),
    onSuccess: (alert) => invalidateAlertSideEffects(queryClient, alert),
  });
};
