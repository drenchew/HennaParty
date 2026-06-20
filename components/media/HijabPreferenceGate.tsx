"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { HijabPreferenceChoice } from "@/components/media/HijabPreferenceChoice";
import { OrnamentalCard } from "@/components/ornamental";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useGuestHijabi } from "@/hooks/useGuestHijabi";
import { isApiError } from "@/lib/utils/api";
import { setGuestHijabiPreference } from "@/services/guest.service";

interface HijabPreferenceGateProps {
  children: ReactNode;
  /** Sync parent scene state after the guest picks a section. */
  onPreferenceSaved?: () => void;
}

/** Ask hijabi vs standard section once, before photo/video uploads. */
export function HijabPreferenceGate({
  children,
  onPreferenceSaved,
}: HijabPreferenceGateProps) {
  const { t } = useLocale();
  const { hijabi, isLoading, refresh } = useGuestHijabi();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChoose(value: boolean) {
    if (saving) return;
    setSaving(true);
    setError(null);

    const result = await setGuestHijabiPreference(value);
    if (isApiError(result)) {
      setError(result.error);
      setSaving(false);
      return;
    }

    refresh();
    onPreferenceSaved?.();
    setSaving(false);
  }

  if (isLoading) {
    return <p className="experience-loading">{t("common.loading")}</p>;
  }

  if (hijabi === null) {
    return (
      <OrnamentalCard>
        <HijabPreferenceChoice
          value={null}
          onChange={handleChoose}
          disabled={saving}
        />
        {error && <p className="experience-error">{error}</p>}
      </OrnamentalCard>
    );
  }

  return <>{children}</>;
}
