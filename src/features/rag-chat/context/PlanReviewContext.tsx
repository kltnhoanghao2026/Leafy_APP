import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { NormalizedPlan } from '../utils/planNormalizer';

export type PlanReviewDraft = {
  sourceQuestion: string;
  savedPlanId?: string;
  plan: NormalizedPlan;
};

interface PlanReviewContextState {
  draft: PlanReviewDraft | null;
  setDraft: (draft: PlanReviewDraft) => void;
  clearDraft: () => void;
}

const PlanReviewContext = createContext<PlanReviewContextState | null>(null);

export const usePlanReviewContext = () => {
  const context = useContext(PlanReviewContext);
  if (!context) {
    throw new Error('usePlanReviewContext must be used within a PlanReviewProvider');
  }
  return context;
};

export const PlanReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraftState] = useState<PlanReviewDraft | null>(null);

  const setDraft = useCallback((newDraft: PlanReviewDraft) => {
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
    <PlanReviewContext.Provider value={value}>
      {children}
    </PlanReviewContext.Provider>
  );
};
