"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import {
  sceneAnimate,
  sceneExit,
  sceneInitial,
  sceneTransition,
} from "@/lib/experience/animations";

interface SceneTransitionProps {
  sceneKey: string;
  children: ReactNode;
}

/** Cinematic page-turn transition between full-screen scenes. */
export function SceneTransition({ sceneKey, children }: SceneTransitionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div key={sceneKey}>{children}</div>;
  }

  return (
    <motion.div
      key={sceneKey}
      className="experience-scene-motion"
      initial={sceneInitial}
      animate={sceneAnimate}
      exit={sceneExit}
      transition={sceneTransition}
    >
      {children}
    </motion.div>
  );
}
