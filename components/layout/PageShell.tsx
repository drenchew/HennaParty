import type { ReactNode } from "react";

interface PageShellProps {
  step: import("@/lib/constants/steps").GuestStep;
  children: ReactNode;
}

/**
 * Shared page wrapper — will host progress stepper, motion, and mobile layout.
 * UI not implemented yet; renders children only.
 */
export function PageShell({ children }: PageShellProps) {
  return <main data-page-shell>{children}</main>;
}
