import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import { RagChatRequest, RagChatResponse, ragChatResponseSchema } from "../schema/ragChat.schema";
import { useTranslation } from "react-i18next";

export const useRagChat = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: RagChatRequest): Promise<RagChatResponse> => {
      // Send snake_case to match Python backend ChatRequest schema
      const response = await apiClient.post<{
        code: number;
        message: string;
        result: RagChatResponse;
      }>(
        API_ENDPOINTS.RAG.CHAT,
        {
          question: data.question,
          thread_id: data.threadId,
          language: data.language,
        },
        { timeout: 120000 }
      );

      // Python RAG service uses code: 200 (not 1000 like Java services)
      if (response.data.code !== 200 || !response.data.result) {
        throw new Error(response.data.message || "Failed to process chat");
      }

      // Map snake_case response back to camelCase 
      const raw = response.data.result as Record<string, unknown>;
      return {
        answer: raw.answer as string,
        threadId: (raw.thread_id ?? raw.threadId) as string,
        documents: (raw.documents ?? []) as RagChatResponse["documents"],
        treatmentPlan: raw.treatment_plan ?? raw.treatmentPlan,
        plantId: (raw.plant_id ?? raw.plantId) as string | undefined,
        webSearchResults: (raw.web_search_results ?? raw.webSearchResults ?? []) as RagChatResponse["webSearchResults"],
        savedPlanId: (raw.saved_plan_id ?? raw.savedPlanId) as string | undefined,
      };
    },
  });
};
