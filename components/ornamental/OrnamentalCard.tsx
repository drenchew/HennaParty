import type { ReactNode } from "react";
import { DecorativeCorners } from "./DecorativeCorners";

interface OrnamentalCardProps {
  children: ReactNode;
  className?: string;
  /** Show subtle corner embroidery overlays. */
  corners?: boolean;
}

/** Cream glass card with tatreez-inspired border. */
export function OrnamentalCard({
  children,
  className = "",
  corners = false,
}: OrnamentalCardProps) {
  return (
    <div className={`ornamental-card ${className}`.trim()}>
      {corners && <DecorativeCorners size={36} />}
      <div className="ornamental-card__inner">{children}</div>
    </div>
  );
}
