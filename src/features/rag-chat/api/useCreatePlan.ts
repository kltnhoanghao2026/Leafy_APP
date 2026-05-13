import { useMutation, useQueryClient } from "@tanstack/react-query";

import { plantEventKeys } from "@/src/features/plant-event/queries";
import {
  planReviewApi,
  type PlanCreateRequest,
} from "./plan-review.api";

export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: PlanCreateRequest) =>
      planReviewApi.createPlan(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantEventKeys.all() });
    },
  });
};

export const useUpdatePlanVisibilityMutation = () =>
  useMutation({
    mutationFn: ({ planId, isPublic }: { planId: string; isPublic: boolean }) =>
      planReviewApi.updateVisibility(planId, isPublic),
  });
