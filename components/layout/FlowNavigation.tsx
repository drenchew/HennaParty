"use client";

import { useRouter } from "next/navigation";
import type { GuestStep } from "@/lib/constants/steps";

interface FlowButtonProps {
  label: string;
  onClick?: () => void | Promise<void | boolean>;
  href?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

/** Primary/secondary action button with client-side navigation. */
export function FlowButton({
  label,
  onClick,
  href,
  disabled,
  variant = "primary",
}: FlowButtonProps) {
  const router = useRouter();

  async function handleClick() {
    if (disabled) return;
    const result = await onClick?.();
    if (result === false) return;
    if (href) router.push(href);
  }

  return (
    <button
      type="button"
      className={`flow-btn flow-btn--${variant}`}
      onClick={() => void handleClick()}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

interface FlowNavProps {
  backStep?: GuestStep;
  backHref?: string;
  backLabel?: string;
  nextLabel: string;
  onNext: () => void | Promise<void | boolean>;
  nextHref: string;
  nextDisabled?: boolean;
}

/** Standard back + continue footer for flow pages. */
export function FlowNav({
  backHref,
  backLabel = "Back",
  nextLabel,
  onNext,
  nextHref,
  nextDisabled,
}: FlowNavProps) {
  const router = useRouter();

  return (
    <div className="flow-nav">
      {backHref && (
        <button
          type="button"
          className="flow-btn flow-btn--secondary"
          onClick={() => router.push(backHref)}
        >
          {backLabel}
        </button>
      )}
      <FlowButton
        label={nextLabel}
        onClick={onNext}
        href={nextHref}
        disabled={nextDisabled}
      />
    </div>
  );
}
