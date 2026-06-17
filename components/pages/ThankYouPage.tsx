"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FlowLayout } from "@/components/layout/FlowLayout";
import { FlowButton } from "@/components/layout/FlowNavigation";
import { StepGuard } from "@/components/layout/StepGuard";
import { ThankYouClosing, ThankYouStats } from "@/components/thank-you";
import { useFlowContext } from "@/components/providers/FlowProvider";
import { STEP_ROUTES } from "@/lib/constants/steps";
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

export function ThankYouPage() {
  const { refresh } = useFlowContext();
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
    <StepGuard step="complete">
      <FlowLayout
        step="complete"
        title=""
        subtitle=""
        footer={
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { delay: 1.2, duration: 0.5 }}
          >
            <FlowButton
              label="Back to Welcome"
              variant="secondary"
              href={STEP_ROUTES.welcome}
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
            <p className="flow-eyebrow">Henna Night</p>
            <h1 className="flow-title">Thank You</h1>
            <p className="flow-subtitle">
              Your love and presence made this night unforgettable.
            </p>
          </motion.header>

          {stats ? (
            <motion.div
              className="flow-card thank-you-card"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <h2 className="flow-stats-title">Tonight we collected</h2>
              <ThankYouStats stats={stats} />
              {error && (
                <p className="flow-meta flow-meta--top flow-error">
                  Could not load live stats right now.
                </p>
              )}
            </motion.div>
          ) : (
            <p className="flow-loading">Gathering celebration stats…</p>
          )}

          <ThankYouClosing />
        </motion.div>
      </FlowLayout>
    </StepGuard>
  );
}
