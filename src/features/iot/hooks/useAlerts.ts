import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { collectorApi } from "../api/collector.api";
import type {
  AlertEventsParams,
  AlertEventItemResponse,
  AlertRuleRequest,
  AlertRuleResponse,
} from "../types";
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

export const alertRulesQueryOptions = () =>
  queryOptions({
    queryKey: iotKeys.alertRules(),
    queryFn: () => collectorApi.getAlertRules(),
    staleTime: 30_000,
    retry: 2,
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

export const useAlertRules = () => {
  return useQuery(alertRulesQueryOptions());
};

const getRuleId = (rule: AlertRuleResponse) => rule.ruleId ?? rule.id;

const invalidateAlertRuleSideEffects = (
  queryClient: ReturnType<typeof useQueryClient>,
  rule?: AlertRuleResponse,
) => {
  queryClient.invalidateQueries({ queryKey: iotKeys.alertRules() });
  queryClient.invalidateQueries({ queryKey: iotKeys.alertRule(getRuleId(rule ?? ({} as AlertRuleResponse))) });
  queryClient.invalidateQueries({ queryKey: iotKeys.alerts() });
};

export const useCreateAlertRuleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AlertRuleRequest) => collectorApi.createAlertRule(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: iotKeys.alertRules() });
      const previous = queryClient.getQueryData<AlertRuleResponse[]>(
        iotKeys.alertRules(),
      );
      queryClient.setQueryData<AlertRuleResponse[]>(
        iotKeys.alertRules(),
        [
          {
            ruleId: `optimistic-${Date.now()}`,
            name: payload.name,
            sensorType: payload.sensorType ?? payload.sensorTypeId ?? "",
            sensorTypeId: payload.sensorTypeId ?? payload.sensorType,
            thresholdMin: payload.thresholdMin ?? payload.minThreshold ?? null,
            thresholdMax: payload.thresholdMax ?? payload.maxThreshold ?? null,
            minThreshold: payload.minThreshold ?? payload.thresholdMin ?? null,
            maxThreshold: payload.maxThreshold ?? payload.thresholdMax ?? null,
            severity: payload.severity,
            enabled: payload.enabled ?? true,
          },
          ...(previous ?? []),
        ],
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(iotKeys.alertRules(), context.previous);
      }
    },
    onSuccess: (rule) => invalidateAlertRuleSideEffects(queryClient, rule),
  });
};

export const useUpdateAlertRuleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ruleId,
      payload,
    }: {
      ruleId: string;
      payload: AlertRuleRequest;
    }) => collectorApi.updateAlertRule(ruleId, payload),
    onMutate: async ({ ruleId, payload }) => {
      await queryClient.cancelQueries({ queryKey: iotKeys.alertRules() });
      const previous = queryClient.getQueryData<AlertRuleResponse[]>(
        iotKeys.alertRules(),
      );
      queryClient.setQueryData<AlertRuleResponse[]>(
        iotKeys.alertRules(),
        (current = []) =>
          current.map((rule) =>
            getRuleId(rule) === ruleId
              ? {
                  ...rule,
                  ...payload,
                  sensorType: payload.sensorType ?? payload.sensorTypeId ?? rule.sensorType,
                  thresholdMin: payload.thresholdMin ?? payload.minThreshold ?? rule.thresholdMin,
                  thresholdMax: payload.thresholdMax ?? payload.maxThreshold ?? rule.thresholdMax,
                  minThreshold: payload.minThreshold ?? payload.thresholdMin ?? rule.minThreshold,
                  maxThreshold: payload.maxThreshold ?? payload.thresholdMax ?? rule.maxThreshold,
                }
              : rule,
          ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(iotKeys.alertRules(), context.previous);
      }
    },
    onSuccess: (rule) => invalidateAlertRuleSideEffects(queryClient, rule),
  });
};

export const useDeleteAlertRuleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => collectorApi.deleteAlertRule(ruleId),
    onMutate: async (ruleId) => {
      await queryClient.cancelQueries({ queryKey: iotKeys.alertRules() });
      const previous = queryClient.getQueryData<AlertRuleResponse[]>(
        iotKeys.alertRules(),
      );
      queryClient.setQueryData<AlertRuleResponse[]>(
        iotKeys.alertRules(),
        (current = []) => current.filter((rule) => getRuleId(rule) !== ruleId),
      );
      return { previous };
    },
    onError: (_error, _ruleId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(iotKeys.alertRules(), context.previous);
      }
    },
    onSuccess: (_result, ruleId) => {
      queryClient.invalidateQueries({ queryKey: iotKeys.alertRules() });
      queryClient.invalidateQueries({ queryKey: iotKeys.alertRule(ruleId) });
      queryClient.invalidateQueries({ queryKey: iotKeys.alerts() });
    },
  });
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
