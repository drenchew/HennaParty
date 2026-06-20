"use client";

import { useCallback, useEffect, useRef } from "react";

const WHEEL_THRESHOLD = 55;
const TRANSITION_COOLDOWN_MS = 900;

interface UseExperienceScrollOptions {
  currentIndex: number;
  maxIndex: number;
  onNext: () => void;
  onPrev: () => void;
  disabled?: boolean;
}

function findScrollContainer(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>(".experience-body, [data-scroll-container]");
}

function canScrollInDirection(element: HTMLElement, direction: "up" | "down"): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const maxScroll = scrollHeight - clientHeight;
  if (maxScroll <= 1) return false;

  if (direction === "down") {
    return scrollTop < maxScroll - 1;
  }

  return scrollTop > 1;
}

/**
 * Desktop: wheel at scroll boundaries moves one scene.
 * Mobile: no swipe-to-change-step — use footer buttons only.
 */
export function useExperienceScroll({
  currentIndex,
  maxIndex,
  onNext,
  onPrev,
  disabled = false,
}: UseExperienceScrollOptions) {
  const wheelAccum = useRef(0);
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
      const scrollContainer = findScrollContainer(event.target);
      if (scrollContainer) {
        const scrollingDown = event.deltaY > 0;
        const scrollingUp = event.deltaY < 0;

        if (
          (scrollingDown && canScrollInDirection(scrollContainer, "down")) ||
          (scrollingUp && canScrollInDirection(scrollContainer, "up"))
        ) {
          return;
        }
      }

      event.preventDefault();
      wheelAccum.current += event.deltaY;

      if (wheelAccum.current >= WHEEL_THRESHOLD) {
        tryNavigate("next");
      } else if (wheelAccum.current <= -WHEEL_THRESHOLD) {
        tryNavigate("prev");
      }
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
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [disabled, tryNavigate]);

  return { tryNavigate, canGoNext, canGoPrev };
}
