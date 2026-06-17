import type { ReactNode } from "react";
import { DecorativeCorners } from "./DecorativeCorners";

interface OrnamentFrameProps {
  children: ReactNode;
  className?: string;
  /** Use on dua and thank-you finale scenes. */
  variant?: "default" | "ceremonial";
}

/** Ceremonial frame for sacred or finale content. */
export function OrnamentFrame({
  children,
  className = "",
  variant = "default",
}: OrnamentFrameProps) {
  return (
    <div className={`ornament-frame ornament-frame--${variant} ${className}`.trim()}>
      <DecorativeCorners />
      <div className="ornament-frame__inner">{children}</div>
    </div>
  );
}
