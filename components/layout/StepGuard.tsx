"use client";

import { useEffect, type ReactNode } from "react";
import { useStepGuard } from "@/hooks/useStepGuard";
import { useFlowContext } from "@/components/providers/FlowProvider";
import type { GuestStep } from "@/lib/constants/steps";

interface StepGuardProps {
  step: GuestStep;
  children: ReactNode;
}

/** Wraps a page and redirects if the guest has not unlocked this step. */
export function StepGuard({ step, children }: StepGuardProps) {
  const { flowState, isReady, canAccess } = useFlowContext();
  useStepGuard(step, flowState, isReady, canAccess);

  if (!isReady) {
    return <div className="flow-guard-loading">Loading…</div>;
  }

  if (!canAccess(step)) {
    return <div className="flow-guard-loading">Redirecting…</div>;
  }

  return <>{children}</>;
}

/** Ensures guest_token exists on mount (welcome page). */
export function GuestTokenInit({ children }: { children: ReactNode }) {
  const { isReady, refresh } = useFlowContext();

  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, refresh]);

  return <>{children}</>;
}
