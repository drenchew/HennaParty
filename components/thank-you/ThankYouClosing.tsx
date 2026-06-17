"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "@/components/providers/LocaleProvider";

export function ThankYouClosing() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="thank-you-closing"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <p className="thank-you-closing-text">{t("thankYou.closingTitle")}</p>
      <p className="thank-you-closing-sub">{t("thankYou.closingSub")}</p>
    </motion.div>
  );
}
