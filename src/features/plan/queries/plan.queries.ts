import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { planApi } from "../api/plan.api";
import type { PlanListParams, PlanStatus, TrackingGranularity } from "../schemas/plan.schema";

export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  list: (params: PlanListParams) => [...planKeys.lists(), params] as const,
  publicLists: () => [...planKeys.all, "publicList"] as const,
  publicList: (params: PlanListParams) => [...planKeys.publicLists(), params] as const,
  applies: () => [...planKeys.all, "applies"] as const,
  applyList: (params: PlanListParams & { status?: PlanStatus | "" }) =>
    [...planKeys.applies(), params] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (planId: string) => [...planKeys.details(), planId] as const,
  applyDetails: () => [...planKeys.all, "applyDetail"] as const,
  applyDetail: (applyId: string) => [...planKeys.applyDetails(), applyId] as const,
};

export function useMyPlans(params: PlanListParams) {
  return useQuery({
    queryKey: planKeys.list(params),
    queryFn: async () => {
      const response = await planApi.getMyPlans(params);
      return response.data.data;
    },
  });
}

export function usePublicPlans(params: PlanListParams) {
  return useQuery({
    queryKey: planKeys.publicList(params),
    queryFn: async () => {
      const response = await planApi.getPublicPlans(params);
      return response.data.data;
    },
  });
}

export function useMyApplies(params: PlanListParams & { status?: PlanStatus | "" }) {
  return useQuery({
    queryKey: planKeys.applyList(params),
    queryFn: async () => {
      const response = await planApi.getMyApplies(params);
      return response.data.data;
    },
  });
}

export function usePlanDetail(planId: string) {
  return useQuery({
    queryKey: planKeys.detail(planId),
    queryFn: async () => {
      const response = await planApi.getPlanDetail(planId);
      return response.data.data;
    },
    enabled: !!planId,
  });
}

export function usePlanApplyDetail(applyId: string) {
  return useQuery({
    queryKey: planKeys.applyDetail(applyId),
    queryFn: async () => {
      const response = await planApi.getApplyDetail(applyId);
      return response.data.data;
    },
    enabled: !!applyId,
  });
}

export function useUpdatePlanVisibilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId }: { planId: string }) => planApi.togglePlanVisibility(planId),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.publicLists() });
    },
  });
}

export function useDeletePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => planApi.deletePlan(planId),
    onSuccess: (_, planId) => {
      queryClient.removeQueries({ queryKey: planKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });
}

export function useBulkDeletePlansMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planIds: string[]) => Promise.all(planIds.map((id) => planApi.deletePlan(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.publicLists() });
    },
  });
}

export function useApplyPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      payload,
    }: {
      planId: string;
      payload: {
        plantId?: string;
        farmPlotId?: string;
        farmZoneId?: string;
        startDate: string;
        trackingGranularity?: TrackingGranularity;
        excludedPlantIds?: string[];
        excludedFarmZoneIds?: string[];
      };
    }) => planApi.applyPlan(planId, payload),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.applies() });
    },
  });
}

export function useUpdateApplyStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applyId,
      status,
      planId,
    }: {
      applyId: string;
      status: PlanStatus;
      planId?: string;
    }) => planApi.updateApplyStatus(applyId, status),
    onSuccess: (_, { planId }) => {
      if (planId) {
        queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) });
      }
      queryClient.invalidateQueries({ queryKey: planKeys.applies() });
    },
  });
}

export function useCancelApplyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applyId: string) => planApi.cancelApply(applyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.applies() });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });
}

export function useCompleteApplyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applyId,
      success,
    }: {
      applyId: string;
      success: boolean;
    }) => planApi.completeApply(applyId, success),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useCreatePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof planApi.createPlan>[0]) =>
      planApi.createPlan(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.publicLists() });
    },
  });
}
