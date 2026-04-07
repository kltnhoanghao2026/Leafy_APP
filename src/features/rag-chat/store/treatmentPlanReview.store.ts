import { create } from "zustand";

import type { NormalizedTreatmentPlan } from "../utils/treatmentPlanNormalizer";

export type TreatmentPlanReviewDraft = {
  sourceQuestion: string;
  savedPlanId?: string;
  plan: NormalizedTreatmentPlan;
};

type TreatmentPlanReviewStore = {
  draft: TreatmentPlanReviewDraft | null;
  setDraft: (draft: TreatmentPlanReviewDraft) => void;
  clearDraft: () => void;
};

export const useTreatmentPlanReviewStore = create<TreatmentPlanReviewStore>(
  (set) => ({
    draft: null,
    setDraft: (draft) => set({ draft }),
    clearDraft: () => set({ draft: null }),
  }),
);
