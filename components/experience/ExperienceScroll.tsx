"use client";

import { AnimatePresence } from "framer-motion";
import { useExperienceContext } from "@/components/experience/ExperienceProvider";
import { SceneTransition } from "@/components/experience/SceneTransition";
import {
  AdviceScene,
  DuaScene,
  PhotosScene,
  QuestionnaireScene,
  ThankYouScene,
  VideoScene,
  WelcomeScene,
} from "@/components/experience/scenes";
import { indexToStep } from "@/lib/experience/steps";

const SCENES = [
  WelcomeScene,
  DuaScene,
  VideoScene,
  PhotosScene,
  AdviceScene,
  QuestionnaireScene,
  ThankYouScene,
] as const;

/** Single-viewport cinematic scroll host — one scene at a time. */
export function ExperienceScroll() {
  const { currentIndex } = useExperienceContext();
  const step = indexToStep(currentIndex);
  const Scene = SCENES[currentIndex];

  return (
    <div className="experience-scroll" data-step={step}>
      <AnimatePresence mode="wait">
        <SceneTransition sceneKey={step}>
          <Scene />
        </SceneTransition>
      </AnimatePresence>
    </div>
  );
}
