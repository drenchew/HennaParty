"use client";

import { useCallback, useEffect, useRef } from "react";

const WHEEL_THRESHOLD = 55;
const SWIPE_THRESHOLD = 60;
const TRANSITION_COOLDOWN_MS = 900;

interface UseExperienceScrollOptions {
  currentIndex: number;
  maxIndex: number;
  onNext: () => void;
  onPrev: () => void;
  disabled?: boolean;
}

/**
 * Controlled step navigation via wheel, touch swipe, and keyboard.
 * Prevents free multi-step jumps — one gesture = one scene.
 */
export function useExperienceScroll({
  currentIndex,
  maxIndex,
  onNext,
  onPrev,
  disabled = false,
}: UseExperienceScrollOptions) {
  const wheelAccum = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const lockedUntil = useRef(0);

  const canGoNext = currentIndex < maxIndex;
  const canGoPrev = currentIndex > 0;

  const tryNavigate = useCallback(
    (direction: "next" | "prev") => {
      const now = Date.now();
      if (disabled || now < lockedUntil.current) return;

      if (direction === "next" && canGoNext) {
        lockedUntil.current = now + TRANSITION_COOLDOWN_MS;
        wheelAccum.current = 0;
        onNext();
      } else if (direction === "prev" && canGoPrev) {
        lockedUntil.current = now + TRANSITION_COOLDOWN_MS;
        wheelAccum.current = 0;
        onPrev();
      }
    },
    [canGoNext, canGoPrev, disabled, onNext, onPrev],
  );

  useEffect(() => {
    if (disabled) return;

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      wheelAccum.current += event.deltaY;

      if (wheelAccum.current >= WHEEL_THRESHOLD) {
        tryNavigate("next");
      } else if (wheelAccum.current <= -WHEEL_THRESHOLD) {
        tryNavigate("prev");
      }
    }

    function onTouchStart(event: TouchEvent) {
      touchStartY.current = event.touches[0]?.clientY ?? null;
    }

    function onTouchEnd(event: TouchEvent) {
      const start = touchStartY.current;
      if (start == null) return;

      const endY = event.changedTouches[0]?.clientY ?? start;
      const delta = start - endY;
      touchStartY.current = null;

      if (delta >= SWIPE_THRESHOLD) tryNavigate("next");
      else if (delta <= -SWIPE_THRESHOLD) tryNavigate("prev");
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        tryNavigate("next");
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        tryNavigate("prev");
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [disabled, tryNavigate]);

  return { tryNavigate, canGoNext, canGoPrev };
}
