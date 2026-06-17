"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { FlowNav } from "@/components/layout/FlowNavigation";
import { StepGuard } from "@/components/layout/StepGuard";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { STEP_ROUTES } from "@/lib/constants/steps";
import { isApiError } from "@/lib/utils/api";
import { completeStep } from "@/services/mock/flow.service";
import { acceptDuaFromApi, assignDuaFromApi } from "@/services/dua.service";
import { initGuest } from "@/services/guest.service";
import type { Dua } from "@/types";

type LoadState = "loading" | "ready" | "error" | "exhausted";

export function DuaPage() {
  const { refresh, nextRoute } = useFlowContext();
  const [dua, setDua] = useState<Dua | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const assignStarted = useRef(false);

  const loadDua = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);

    const init = await initGuest();
    if (isApiError(init)) {
      setLoadState("error");
      setErrorMessage(init.error);
      return;
    }

    const result = await assignDuaFromApi();
    if (isApiError(result)) {
      if (result.code === "DUA_POOL_EXHAUSTED") {
        setLoadState("exhausted");
        return;
      }
      setLoadState("error");
      setErrorMessage(result.error);
      return;
    }

    setDua(result.data.dua);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    if (assignStarted.current) return;
    assignStarted.current = true;
    void loadDua();
  }, [loadDua]);

  async function handleAccept(): Promise<boolean> {
    if (!dua || accepting) return false;

    setAccepting(true);
    setErrorMessage(null);

    const result = await acceptDuaFromApi();
    if (isApiError(result)) {
      setErrorMessage(result.error);
      setAccepting(false);
      return false;
    }

    completeStep("dua", {
      dua: {
        id: result.data.dua.id,
        arabic: result.data.dua.arabic,
        translation: result.data.dua.translation,
      },
    });
    refresh();
    setAccepting(false);
    return true;
  }

  return (
    <StepGuard step="dua">
      <FlowLayout
        step="dua"
        title="Your Unique Dua"
        subtitle="A Duaa chosen just for you!"
        footer={
          loadState === "ready" ? (
            <FlowNav
              backHref={STEP_ROUTES.welcome}
              nextLabel={accepting ? "Accepting…" : "Ameen"}
              onNext={handleAccept}
              nextHref={nextRoute("dua")}
              nextDisabled={!dua || accepting}
            />
          ) : null
        }
      >
        {loadState === "loading" && (
          <p className="flow-loading">Assigning your unique dua…</p>
        )}

        {loadState === "exhausted" && (
          <div className="flow-card">
            <p className="flow-error">
              All duas have been shared tonight. Thank you for being part of this
              celebration.
            </p>
          </div>
        )}

        {loadState === "error" && (
          <div className="flow-card flow-stack">
            <p className="flow-error">{errorMessage ?? "Could not load your dua."}</p>
            <button
              type="button"
              className="flow-btn flow-btn--secondary"
              onClick={() => {
                assignStarted.current = false;
                void loadDua();
              }}
            >
              Try again
            </button>
          </div>
        )}

        {loadState === "ready" && dua && (
          <article className="flow-card flow-dua">
            <p className="flow-dua-arabic" lang="ar" dir="rtl">
              {dua.arabic}
            </p>
            <p className="flow-dua-translation">{dua.translation}</p>
          </article>
        )}

        {errorMessage && loadState === "ready" && (
          <p className="flow-error">{errorMessage}</p>
        )}
      </FlowLayout>
    </StepGuard>
  );
}
