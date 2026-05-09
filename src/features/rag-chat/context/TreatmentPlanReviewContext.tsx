import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { NormalizedTreatmentPlan } from '../utils/treatmentPlanNormalizer';

export type TreatmentPlanReviewDraft = {
  sourceQuestion: string;
  savedPlanId?: string;
  plan: NormalizedTreatmentPlan;
};

interface TreatmentPlanReviewContextState {
  draft: TreatmentPlanReviewDraft | null;
  setDraft: (draft: TreatmentPlanReviewDraft) => void;
  clearDraft: () => void;
}

const TreatmentPlanReviewContext = createContext<TreatmentPlanReviewContextState | null>(null);

export const useTreatmentPlanReviewContext = () => {
  const context = useContext(TreatmentPlanReviewContext);
  if (!context) {
    throw new Error('useTreatmentPlanReviewContext must be used within a TreatmentPlanReviewProvider');
  }
  return context;
};

export const TreatmentPlanReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraftState] = useState<TreatmentPlanReviewDraft | null>(null);

  const setDraft = useCallback((newDraft: TreatmentPlanReviewDraft) => {
    setDraftState(newDraft);
  }, []);

  const clearDraft = useCallback(() => {
    setDraftState(null);
  }, []);

  const value = useMemo(
    () => ({
      draft,
      setDraft,
      clearDraft,
    }),
    [draft, setDraft, clearDraft]
  );

  return (
    <TreatmentPlanReviewContext.Provider value={value}>
      {children}
    </TreatmentPlanReviewContext.Provider>
  );
};
