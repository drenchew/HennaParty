"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { EventStats } from "@/types";

interface ThankYouStatsProps {
  stats: EventStats;
}

export function ThankYouStats({ stats }: ThankYouStatsProps) {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();

  const statItems: Array<{
    key: keyof Pick<EventStats, "duas_assigned" | "photos_uploaded" | "messages_count" | "votes_count">;
    labelKey: "stats.duas" | "stats.photos" | "stats.messages" | "stats.votes";
    emoji: string;
  }> = [
    { key: "duas_assigned", labelKey: "stats.duas", emoji: "🤲" },
    { key: "photos_uploaded", labelKey: "stats.photos", emoji: "📸" },
    { key: "messages_count", labelKey: "stats.messages", emoji: "💌" },
    { key: "votes_count", labelKey: "stats.votes", emoji: "✨" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : { staggerChildren: 0.12, delayChildren: 0.35 },
    },
  };

  const item = {
    hidden: reduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.96 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 260, damping: 22 },
    },
  };

  return (
    <motion.dl
      className="thank-you-stats"
      variants={container}
      initial="hidden"
      animate="show"
      aria-label={t("stats.label")}
    >
      {statItems.map((entry) => (
        <motion.div key={entry.key} className="thank-you-stat" variants={item}>
          <dt>
            <span className="thank-you-stat-emoji" aria-hidden>
              {entry.emoji}
            </span>
            {t(entry.labelKey)}
          </dt>
          <dd>{stats[entry.key].toLocaleString()}</dd>
        </motion.div>
      ))}
    </motion.dl>
  );
}
