"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import type { EventStats } from "@/types";

const STAT_ITEMS: Array<{
  key: keyof Pick<
    EventStats,
    "duas_assigned" | "photos_uploaded" | "messages_count" | "votes_count"
  >;
  label: string;
  emoji: string;
}> = [
  { key: "duas_assigned", label: "Duas received", emoji: "🤲" },
  { key: "photos_uploaded", label: "Photos shared", emoji: "📸" },
  { key: "messages_count", label: "Advice messages", emoji: "💌" },
  { key: "votes_count", label: "Questionnaire votes", emoji: "✨" },
];

interface ThankYouStatsProps {
  stats: EventStats;
}

export function ThankYouStats({ stats }: ThankYouStatsProps) {
  const reduceMotion = useReducedMotion();

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
      aria-label="Celebration statistics"
    >
      {STAT_ITEMS.map((entry) => (
        <motion.div key={entry.key} className="thank-you-stat" variants={item}>
          <dt>
            <span className="thank-you-stat-emoji" aria-hidden>
              {entry.emoji}
            </span>
            {entry.label}
          </dt>
          <dd>{stats[entry.key].toLocaleString()}</dd>
        </motion.div>
      ))}
    </motion.dl>
  );
}
