"use client";

import { OrnamentalButton } from "@/components/ornamental";
import { useLocale } from "@/components/providers/LocaleProvider";

interface ExperienceNavProps {
  backLabel?: string;
  continueLabel?: string;
  onBack?: () => void;
  onContinue?: () => void | Promise<void | boolean>;
  continueDisabled?: boolean;
  showBack?: boolean;
  showContinue?: boolean;
}

/** Scene footer navigation with ornamental buttons. */
export function ExperienceNav({
  backLabel,
  continueLabel,
  onBack,
  onContinue,
  continueDisabled,
  showBack = Boolean(onBack),
  showContinue = true,
}: ExperienceNavProps) {
  const { t } = useLocale();
  const resolvedBackLabel = backLabel ?? t("common.back");
  const resolvedContinueLabel = continueLabel ?? t("common.continue");

  async function handleContinue() {
    if (continueDisabled || !onContinue) return;
    await onContinue();
  }

  return (
    <div className="experience-nav">
      {showBack && onBack ? (
        <OrnamentalButton variant="secondary" onClick={onBack}>
          {resolvedBackLabel}
        </OrnamentalButton>
      ) : null}
      {showContinue && onContinue ? (
        <OrnamentalButton onClick={() => void handleContinue()} disabled={continueDisabled}>
          {resolvedContinueLabel}
        </OrnamentalButton>
      ) : null}
    </div>
  );
}
