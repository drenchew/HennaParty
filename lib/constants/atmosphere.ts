/**
 * Gold dust particle tuning — edit these values to change density and motion.
 *
 * More particles → raise countDesktop / countMobile max values
 * Fewer particles → lower those ranges (or countLowEnd on weak devices)
 * Faster drift  → increase speedMultiplier or widen riseY / driftX ranges
 * Slower drift  → decrease speedMultiplier or narrow those ranges
 */
export const GOLD_DUST_CONFIG = {
  /** Global motion multiplier (1 = default, 2 = twice as fast, 0.5 = half speed). */
  speedMultiplier: 50,

  /** Random count range on desktop (width ≥ 768px). */
  countDesktop: { min: 60, max: 100 },

  /** Random count range on mobile. */
  countMobile: { min: 50, max: 80 },

  /** Fixed count on low-end devices (≤2 CPU cores or ≤2 GB RAM). */
  countLowEnd: 12,

  /** Horizontal drift per frame at ~60fps (px). */
  driftX: { min: -0.08, max: 0.08 },

  /** Vertical rise per frame — negative values float upward. */
  riseY: { min: -0.12, max: -0.04 },

  /** How quickly each particle twinkles in/out. */
  opacitySpeed: { min: 0.01, max: 0.1 },

  /** Dot radius in px. */
  size: { min: 1.2, max: 3.5 },

  /** Base opacity before twinkle (0–1). */
  opacity: { min: 0.12, max: 0.28 },
} as const;
