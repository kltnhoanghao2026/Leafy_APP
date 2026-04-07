import { useMutation, useQueryClient } from "@tanstack/react-query";

import { plantEventKeys } from "@/src/features/plant-event/queries";
import {
  treatmentPlanReviewApi,
  type TreatmentPlanCreateRequest,
} from "./treatment-plan-review.api";

export const useCreateTreatmentPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TreatmentPlanCreateRequest) =>
      treatmentPlanReviewApi.createPlan(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantEventKeys.all() });
    },
  });
};
