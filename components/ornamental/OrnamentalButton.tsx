import type { ButtonHTMLAttributes, ReactNode } from "react";

interface OrnamentalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
}

/** Embroidery-inspired action button — not a default rounded pill. */
export function OrnamentalButton({
  children,
  variant = "primary",
  fullWidth = true,
  className = "",
  type = "button",
  ...props
}: OrnamentalButtonProps) {
  return (
    <button
      type={type}
      className={[
        "ornamental-btn",
        `ornamental-btn--${variant}`,
        fullWidth ? "ornamental-btn--full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className="ornamental-btn__edge ornamental-btn__edge--left" aria-hidden />
      <span className="ornamental-btn__label">{children}</span>
      <span className="ornamental-btn__edge ornamental-btn__edge--right" aria-hidden />
    </button>
  );
}
