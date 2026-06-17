/** Calm ceremonial easing — page-turn feel, not flashy. */
export const SCENE_EASE = [0.22, 1, 0.36, 1] as const;

export const SCENE_DURATION = 0.75;

export const sceneTransition = {
  duration: SCENE_DURATION,
  ease: SCENE_EASE,
} as const;

export const sceneInitial = {
  opacity: 0,
  scale: 0.99,
  y: 28,
  filter: "blur(6px)",
};

export const sceneAnimate = {
  opacity: 1,
  scale: 1,
  y: 0,
  filter: "blur(0px)",
};

export const sceneExit = {
  opacity: 0,
  scale: 0.98,
  y: -14,
  filter: "blur(4px)",
};
