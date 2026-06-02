import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { diagnosisHistoryApi } from "./diagnosis-history.api";

export const diagnosisHistoryKeys = {
  all: ["diagnosis-history"] as const,
  requests: (page: number, size: number) =>
    [...diagnosisHistoryKeys.all, "requests", page, size] as const,
  resultByRequest: (requestId: string) =>
    [...diagnosisHistoryKeys.all, "result", requestId] as const,
};

export const useDiagnosisRequests = (page = 0, size = 20, enabled = true) =>
  useQuery({
    queryKey: diagnosisHistoryKeys.requests(page, size),
    queryFn: () => diagnosisHistoryApi.getRequests(page, size),
    enabled,
  });

export const useDiagnosisResults = (page = 0, size = 50, enabled = true) =>
  useQuery({
    queryKey: [...diagnosisHistoryKeys.all, "results", page, size] as const,
    queryFn: () => diagnosisHistoryApi.getResults(page, size),
    enabled,
  });

export const useDiagnosisResultByRequest = (requestId?: string, enabled = true) =>
  useQuery({
    queryKey: diagnosisHistoryKeys.resultByRequest(requestId ?? ""),
    queryFn: () => diagnosisHistoryApi.getResultByRequest(requestId ?? ""),
    enabled: enabled && !!requestId,
  });

export const useUpdateRequestPlantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, plantId }: { requestId: string; plantId: string | null }) =>
      diagnosisHistoryApi.updateRequestPlant(requestId, plantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diagnosisHistoryKeys.all });
    },
  });
};
