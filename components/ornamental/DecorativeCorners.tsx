import type { ReactNode, SVGProps } from "react";

interface DecorativeCornersProps {
  className?: string;
  size?: number;
}

/** Tatreez-inspired corner flourishes for ceremonial frames. */
export function DecorativeCorners({ className = "", size = 48 }: DecorativeCornersProps) {
  return (
    <>
      <Corner className={`ornament-corner ornament-corner--tl ${className}`} size={size} />
      <Corner className={`ornament-corner ornament-corner--tr ${className}`} size={size} />
      <Corner className={`ornament-corner ornament-corner--bl ${className}`} size={size} />
      <Corner className={`ornament-corner ornament-corner--br ${className}`} size={size} />
    </>
  );
}

function Corner({ className, size }: { className: string; size: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 4h16v2H6v14H4V4zm0 0l14 14M4 20h2V6h14"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.85"
      />
      <rect x="8" y="8" width="6" height="6" fill="currentColor" opacity="0.35" />
      <circle cx="18" cy="18" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
