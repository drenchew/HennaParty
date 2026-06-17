import type { Locale } from "./types";

/** Display labels for questionnaire — API still stores English canonical answers. */
export const QUESTIONNAIRE_DISPLAY: Record<
  number,
  {
    question: Record<Locale, string>;
    options: Record<string, Record<Locale, string>>;
  }
> = {
  1: {
    question: {
      ar: "ماذا يجب أن نفعل في سنتنا الأولى؟",
      en: "What should we do in our first year?",
    },
    options: {
      "Travel the world": { ar: "نسافر حول العالم", en: "Travel the world" },
      "Focus on faith & family": { ar: "نركز على الإيمان والعائلة", en: "Focus on faith & family" },
      "Build our home together": { ar: "نبني بيتنا معاً", en: "Build our home together" },
      "Celebrate every moment": { ar: "نحتفل بكل لحظة", en: "Celebrate every moment" },
    },
  },
  2: {
    question: {
      ar: "ما الأهم في الزواج؟",
      en: "What is most important in marriage?",
    },
    options: {
      Trust: { ar: "الثقة", en: "Trust" },
      Communication: { ar: "التواصل", en: "Communication" },
      Patience: { ar: "الصبر", en: "Patience" },
      Laughter: { ar: "الضحك", en: "Laughter" },
    },
  },
  3: {
    question: {
      ar: "أين يجب أن نسافر أولاً؟",
      en: "Where should we travel first?",
    },
    options: {
      "Makkah / Umrah": { ar: "مكة / العمرة", en: "Makkah / Umrah" },
      "Tropical beach": { ar: "شاطئ استوائي", en: "Tropical beach" },
      "European cities": { ar: "مدن أوروبية", en: "European cities" },
      "Somewhere new together": { ar: "مكاناً جديداً معاً", en: "Somewhere new together" },
    },
  },
};

export function localizeQuestionText(
  questionId: number,
  locale: Locale,
  fallback: string,
): string {
  return QUESTIONNAIRE_DISPLAY[questionId]?.question[locale] ?? fallback;
}

export function localizeOptionText(
  questionId: number,
  canonicalAnswer: string,
  locale: Locale,
): string {
  return (
    QUESTIONNAIRE_DISPLAY[questionId]?.options[canonicalAnswer]?.[locale] ??
    canonicalAnswer
  );
}
