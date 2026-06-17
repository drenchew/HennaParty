"use client";

import { useState } from "react";
import { DecorativeCorners } from "@/components/ornamental/DecorativeCorners";
import { OrnamentDivider } from "@/components/ornamental";
import { useLocale } from "@/components/providers/LocaleProvider";
import { COUPLE_PHOTO_PATH } from "@/lib/constants/welcome";

export function CouplePhotoFrame() {
  const { t } = useLocale();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="welcome-couple-frame">
      <DecorativeCorners size={40} />
      <div className="welcome-couple-frame__inner">
        {!imageError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={COUPLE_PHOTO_PATH}
            alt={t("welcome.photoAlt")}
            className="welcome-couple-frame__photo"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="welcome-couple-frame__placeholder">
            <span className="welcome-couple-frame__placeholder-icon" aria-hidden>
              ✦
            </span>
            <p>{t("welcome.photoPlaceholder")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
