"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { GuestStep } from "@/lib/constants/steps";
import { setStoredStep } from "@/lib/guest/step-storage";

interface StepNavigationProps {
  href: string;
  label: string;
  nextStep?: GuestStep;
  onNavigate?: () => void | Promise<void>;
}

/** Generic next/back navigation — records client step before navigation. */
export function StepNavigation({
  href,
  label,
  nextStep,
  onNavigate,
}: StepNavigationProps) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (nextStep) setStoredStep(nextStep);
        void onNavigate?.();
      }}
      data-nav={label}
    >
      {label}
    </Link>
  );
}

interface StepPlaceholderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function StepPlaceholder({ title, description, children }: StepPlaceholderProps) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </section>
  );
}
