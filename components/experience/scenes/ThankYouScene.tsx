"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExperienceNav } from "@/components/experience/ExperienceNav";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneShell } from "@/components/experience/SceneShell";
import { OrnamentalCard, OrnamentFrame } from "@/components/ornamental";
import { ThankYouClosing, ThankYouStats } from "@/components/thank-you";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { isApiError } from "@/lib/utils/api";
import { completeStep } from "@/services/mock/flow.service";
import { getEventStats } from "@/services/guest.service";
import type { EventStats } from "@/types";

const EMPTY_STATS: EventStats = {
  duas_assigned: 0,
  photos_uploaded: 0,
  messages_count: 0,
  votes_count: 0,
  videos_count: 0,
};

export function ThankYouScene() {
  const { refresh } = useFlowContext();
  const { goToStep } = useExperienceContext();
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeStep("complete");
    refresh();

    void (async () => {
      const result = await getEventStats();
      if (isApiError(result)) {
        setError(result.error);
        setStats(EMPTY_STATS);
        return;
      }
      setStats(result.data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  return (
    <SceneShell
      step="complete"
      title=""
      subtitle=""
      framed
      footer={
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 1.2, duration: 0.5 }}
        >
          <ExperienceNav
            continueLabel={t("thankYou.backWelcome")}
            onContinue={() => goToStep("welcome")}
            showBack={false}
          />
        </motion.div>
      }
    >
      <motion.div
        className="thank-you-page"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
      >
        <OrnamentFrame variant="ceremonial">
          <motion.header
            className="thank-you-header"
            initial={reduceMotion ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <p className="experience-eyebrow">{t("common.hennaNight")}</p>
            <h2 className="experience-title">{t("thankYou.title")}</h2>
            <p className="experience-subtitle">{t("thankYou.subtitle")}</p>
          </motion.header>
        </OrnamentFrame>

        {stats ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <OrnamentalCard corners>
              <h3 className="experience-stats-title">{t("thankYou.statsTitle")}</h3>
              <ThankYouStats stats={stats} />
              {error && (
                <p className="experience-meta experience-meta--top experience-error">
                  {t("thankYou.statsError")}
                </p>
              )}
            </OrnamentalCard>
          </motion.div>
        ) : (
          <p className="experience-loading">{t("thankYou.gatheringStats")}</p>
        )}

        <ThankYouClosing />
      </motion.div>
    </SceneShell>
  );
}
