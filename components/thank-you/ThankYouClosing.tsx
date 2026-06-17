"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ThankYouClosing() {
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
      <p className="thank-you-closing-text">
        Thank you for being part of our story
      </p>
      <p className="thank-you-closing-sub">
        Every dua, photo, message, and vote tonight becomes part of a memory we
        will cherish forever. May Allah bless this union with love, mercy, and
        barakah.
      </p>
    </motion.div>
  );
}
