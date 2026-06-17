"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneShell } from "@/components/experience/SceneShell";
import { OrnamentalButton, OrnamentalCard, OrnamentFrame } from "@/components/ornamental";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { isApiError } from "@/lib/utils/api";
import { completeStep } from "@/services/mock/flow.service";
import { acceptDuaFromApi, assignDuaFromApi } from "@/services/dua.service";
import { initGuest } from "@/services/guest.service";
import type { Dua } from "@/types";

type LoadState = "loading" | "ready" | "error" | "exhausted";

export function DuaScene() {
  const { refresh } = useFlowContext();
  const { nextStep, prevStep } = useExperienceContext();
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

  async function handleAccept() {
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
    nextStep();
    return true;
  }

  return (
    <SceneShell
      step="dua"
      title="Your Unique Dua"
      subtitle="A prayer chosen just for you — may it bring barakah to the couple and to you."
      framed
      footer={
        loadState === "ready" ? (
          <ExperienceNav
            onBack={prevStep}
            continueLabel={accepting ? "Accepting…" : "I accept this dua"}
            onContinue={handleAccept}
            continueDisabled={!dua || accepting}
          />
        ) : null
      }
    >
      {loadState === "loading" && (
        <p className="experience-loading">Assigning your unique dua…</p>
      )}

      {loadState === "exhausted" && (
        <OrnamentalCard>
          <p className="experience-error">
            All duas have been shared tonight. Thank you for being part of this celebration.
          </p>
        </OrnamentalCard>
      )}

      {loadState === "error" && (
        <OrnamentalCard>
          <div className="experience-stack">
            <p className="experience-error">{errorMessage ?? "Could not load your dua."}</p>
            <OrnamentalButton
              variant="secondary"
              onClick={() => {
                assignStarted.current = false;
                void loadDua();
              }}
            >
              Try again
            </OrnamentalButton>
          </div>
        </OrnamentalCard>
      )}

      {loadState === "ready" && dua && (
        <OrnamentFrame variant="ceremonial">
          <p className="experience-dua-arabic" lang="ar" dir="rtl">
            {dua.arabic}
          </p>
          <p className="experience-dua-translation">{dua.translation}</p>
        </OrnamentFrame>
      )}

      {errorMessage && loadState === "ready" && (
        <p className="experience-error">{errorMessage}</p>
      )}
    </SceneShell>
  );
}
