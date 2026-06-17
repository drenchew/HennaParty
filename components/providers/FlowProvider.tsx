"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFlow } from "@/hooks/useFlow";
import type { FlowState } from "@/lib/flow/types";
import type { GuestStep } from "@/lib/constants/steps";

interface FlowContextValue {
  guestToken: string | null;
  flowState: FlowState | null;
  isReady: boolean;
  maxAccessibleStep: GuestStep;
  canAccess: (step: GuestStep) => boolean;
  isComplete: (step: GuestStep) => boolean;
  nextRoute: (step: GuestStep) => string;
  refresh: () => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const value = useFlow();
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlowContext(): FlowContextValue {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error("useFlowContext must be used within FlowProvider");
  }
  return context;
}

/** @deprecated Use useFlowContext — kept for gradual migration. */
export const GuestProvider = FlowProvider;
export const useGuestContext = useFlowContext;
