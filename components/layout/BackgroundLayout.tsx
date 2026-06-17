"use client";

import type { ReactNode } from "react";

interface BackgroundLayoutProps {
  children: ReactNode;
}

/**
 * Fixed full-screen ornamental background with readability overlays.
 * Drop your generated image at /public/backgrounds/henna-mobile.webp to override the SVG fallback.
 */
export function BackgroundLayout({ children }: BackgroundLayoutProps) {
  return (
    <div className="henna-bg-root">
      <div className="henna-bg-layer" aria-hidden />
      <div className="henna-bg-overlay henna-bg-overlay--top" aria-hidden />
      <div className="henna-bg-overlay henna-bg-overlay--bottom" aria-hidden />
      <div className="henna-bg-vignette" aria-hidden />
      <div className="henna-bg-content">{children}</div>
    </div>
  );
}
