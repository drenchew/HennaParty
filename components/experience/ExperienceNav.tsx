"use client";

import { OrnamentalButton } from "@/components/ornamental";

interface ExperienceNavProps {
  backLabel?: string;
  continueLabel: string;
  onBack?: () => void;
  onContinue: () => void | Promise<void | boolean>;
  continueDisabled?: boolean;
  showBack?: boolean;
}

/** Scene footer navigation with ornamental buttons. */
export function ExperienceNav({
  backLabel = "Back",
  continueLabel,
  onBack,
  onContinue,
  continueDisabled,
  showBack = Boolean(onBack),
}: ExperienceNavProps) {
  async function handleContinue() {
    if (continueDisabled) return;
    await onContinue();
  }

  return (
    <div className="experience-nav">
      {showBack && onBack ? (
        <OrnamentalButton variant="secondary" onClick={onBack}>
          {backLabel}
        </OrnamentalButton>
      ) : null}
      <OrnamentalButton onClick={() => void handleContinue()} disabled={continueDisabled}>
        {continueLabel}
      </OrnamentalButton>
    </div>
  );
}
