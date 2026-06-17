"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GuestStep } from "@/lib/constants/steps";
import {
  canAccessStep,
  getMaxAccessibleStep,
  getNextStep,
  getStepRoute,
  isStepComplete,
} from "@/lib/flow/progress";
import type { FlowState } from "@/lib/flow/types";
import { getOrCreateGuestToken } from "@/lib/guest/session";
import {
  getFlowState,
  initFlowState,
  persistFlowState,
} from "@/services/mock/flow.service";

export function useFlow() {
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [isReady, setIsReady] = useState(false);

  const hydrate = useCallback(() => {
    const token = getOrCreateGuestToken();
    setGuestToken(token);
    const state = initFlowState();
    setFlowState(state);
    setIsReady(true);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const updateState = useCallback((state: FlowState) => {
    persistFlowState(state);
    setFlowState(state);
  }, []);

  const refresh = useCallback(() => {
    setFlowState(getFlowState());
  }, []);

  const maxAccessibleStep = useMemo(
    () => (flowState ? getMaxAccessibleStep(flowState) : "welcome"),
    [flowState],
  );

  const canAccess = useCallback(
    (step: GuestStep) => (flowState ? canAccessStep(flowState, step) : step === "welcome"),
    [flowState],
  );

  const isComplete = useCallback(
    (step: GuestStep) => (flowState ? isStepComplete(flowState, step) : false),
    [flowState],
  );

  const nextRoute = useCallback((step: GuestStep) => {
    const next = getNextStep(step);
    return next ? getStepRoute(next) : getStepRoute("complete");
  }, []);

  return {
    guestToken,
    flowState,
    isReady,
    maxAccessibleStep,
    canAccess,
    isComplete,
    nextRoute,
    updateState,
    refresh,
    hydrate,
  };
}
