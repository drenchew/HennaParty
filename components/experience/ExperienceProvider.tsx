"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { getMaxAccessibleStep } from "@/lib/flow/progress";
import { useExperienceScroll } from "@/hooks/useExperienceScroll";
import type { GuestStep } from "@/lib/constants/steps";
import { indexToStep, stepToIndex } from "@/lib/experience/steps";
import { getFlowState } from "@/services/mock/flow.service";

interface ExperienceContextValue {
  currentIndex: number;
  currentStep: GuestStep;
  maxAccessibleIndex: number;
  isTransitionLocked: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: GuestStep) => void;
  setTransitionLocked: (locked: boolean) => void;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const { isReady, maxAccessibleStep } = useFlowContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionLocked, setTransitionLocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const maxAccessibleIndex = useMemo(
    () => stepToIndex(maxAccessibleStep),
    [maxAccessibleStep],
  );

  useEffect(() => {
    if (!isReady || hydrated) return;
    setCurrentIndex(maxAccessibleIndex);
    setHydrated(true);
  }, [hydrated, isReady, maxAccessibleIndex]);

  useEffect(() => {
    if (!hydrated) return;
    setCurrentIndex((prev) => Math.min(prev, maxAccessibleIndex));
  }, [hydrated, maxAccessibleIndex]);

  const nextStep = useCallback(() => {
    setCurrentIndex((prev) => {
      const max = stepToIndex(getMaxAccessibleStep(getFlowState()));
      const next = prev + 1;
      if (next > max) return prev;
      return Math.min(next, stepToIndex("complete"));
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((step: GuestStep) => {
    const index = stepToIndex(step);
    const max = stepToIndex(getMaxAccessibleStep(getFlowState()));
    if (index <= max) {
      setCurrentIndex(index);
    }
  }, []);

  useExperienceScroll({
    currentIndex,
    maxIndex: maxAccessibleIndex,
    onNext: nextStep,
    onPrev: prevStep,
    disabled: transitionLocked || !hydrated,
  });

  const value = useMemo<ExperienceContextValue>(
    () => ({
      currentIndex,
      currentStep: indexToStep(currentIndex),
      maxAccessibleIndex,
      isTransitionLocked: transitionLocked,
      nextStep,
      prevStep,
      goToStep,
      setTransitionLocked,
    }),
    [
      currentIndex,
      maxAccessibleIndex,
      nextStep,
      prevStep,
      goToStep,
      transitionLocked,
    ],
  );

  return (
    <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>
  );
}

export function useExperienceContext(): ExperienceContextValue {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperienceContext must be used within ExperienceProvider");
  }
  return context;
}
