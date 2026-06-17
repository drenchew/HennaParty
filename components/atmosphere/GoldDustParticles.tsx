"use client";

import { useEffect, useRef } from "react";
import { GOLD_DUST_CONFIG } from "@/lib/constants/atmosphere";

const COLORS = ["#E8C872", "#D8B56A", "#C8A96A", "#F0E0B0", "#B89858"] as const;

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  opacitySpeed: number;
  opacityPhase: number;
  driftX: number;
  riseY: number;
  color: string;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (cores <= 2) return true;
  if (memory !== undefined && memory <= 2) return true;
  return false;
}

function targetParticleCount(reducedMotion: boolean, lowEnd: boolean): number {
  if (reducedMotion) return 0;
  if (lowEnd) return GOLD_DUST_CONFIG.countLowEnd;
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  const range = mobile ? GOLD_DUST_CONFIG.countMobile : GOLD_DUST_CONFIG.countDesktop;
  return Math.round(randomBetween(range.min, range.max));
}

function createParticle(width: number, height: number): Particle {
  const speed = GOLD_DUST_CONFIG.speedMultiplier;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: randomBetween(GOLD_DUST_CONFIG.size.min, GOLD_DUST_CONFIG.size.max),
    opacity: randomBetween(GOLD_DUST_CONFIG.opacity.min, GOLD_DUST_CONFIG.opacity.max),
    opacitySpeed:
      randomBetween(
        GOLD_DUST_CONFIG.opacitySpeed.min,
        GOLD_DUST_CONFIG.opacitySpeed.max
      ) * speed,    opacityPhase: Math.random() * Math.PI * 2,
    driftX:
      randomBetween(GOLD_DUST_CONFIG.driftX.min, GOLD_DUST_CONFIG.driftX.max) * speed,
    riseY:
      randomBetween(GOLD_DUST_CONFIG.riseY.min, GOLD_DUST_CONFIG.riseY.max) * speed,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0],
  };
}

function seedParticles(count: number, width: number, height: number): Particle[] {
  return Array.from({ length: count }, () => createParticle(width, height));
}

/**
 * Canvas gold-dust particles — slow upward drift, soft glow, very low opacity.
 */
export function GoldDustParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);
  const lowEndRef = useRef(false);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const context = canvasEl.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = media.matches;
    lowEndRef.current = isLowEndDevice();

    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = true;
    let lastTime = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvasEl!.width = Math.floor(width * dpr);
      canvasEl!.height = Math.floor(height * dpr);
      canvasEl!.style.width = `${width}px`;
      canvasEl!.style.height = `${height}px`;
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = targetParticleCount(reducedMotionRef.current, lowEndRef.current);
      particlesRef.current = seedParticles(count, width, height);
    }

    function wrapParticle(particle: Particle) {
      if (particle.y < -8) {
        particle.y = height + 8;
        particle.x = Math.random() * width;
      }
      if (particle.x < -8) particle.x = width + 8;
      if (particle.x > width + 8) particle.x = -8;
    }

    function draw(time: number) {
      if (!running) return;

      if (reducedMotionRef.current || particlesRef.current.length === 0) {
        return;
      }

      const delta = lastTime ? Math.min(time - lastTime, 32) : 16;
      lastTime = time;

      context!.clearRect(0, 0, width, height);

      const speedScale = delta / 16;

      for (const particle of particlesRef.current) {
        particle.x += particle.driftX * speedScale;
        particle.y += particle.riseY * speedScale;

        particle.opacityPhase += particle.opacitySpeed * speedScale;
        const fade = 0.5 + 0.5 * Math.sin(particle.opacityPhase);
        const alpha = Math.min(0.42, particle.opacity * (0.7 + fade * 0.3));

        context!.save();
        context!.globalCompositeOperation = "source-over";
        context!.globalAlpha = alpha * 0.35;
        context!.fillStyle = particle.color;
        context!.shadowColor = particle.color;
        context!.shadowBlur = particle.size * 5;
        context!.beginPath();
        context!.arc(particle.x, particle.y, particle.size * 1.4, 0, Math.PI * 2);
        context!.fill();

        context!.globalAlpha = alpha;
        context!.shadowBlur = particle.size * 2;
        context!.beginPath();
        context!.arc(particle.x, particle.y, particle.size * 0.55, 0, Math.PI * 2);
        context!.fill();
        context!.restore();

        wrapParticle(particle);
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    function startLoop() {
      if (reducedMotionRef.current || particlesRef.current.length === 0) return;
      lastTime = 0;
      frameRef.current = requestAnimationFrame(draw);
    }

    function onMotionChange(event: MediaQueryListEvent) {
      reducedMotionRef.current = event.matches;
      cancelAnimationFrame(frameRef.current);
      resize();
      if (running) startLoop();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameRef.current);
      } else {
        running = true;
        startLoop();
      }
    }

    resize();
    startLoop();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    media.addEventListener("change", onMotionChange);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      media.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="atmosphere-particles"
      aria-hidden
      role="presentation"
    />
  );
}
