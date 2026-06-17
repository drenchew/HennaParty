import type { MockDua } from "./types";

export const MOCK_DUA_POOL: MockDua[] = [
  {
    id: 1,
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ",
    translation:
      "Our Lord, grant us from among our spouses and offspring comfort to our eyes.",
  },
  {
    id: 2,
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
    translation: "Our Lord, give us good in this world and good in the Hereafter.",
  },
  {
    id: 3,
    arabic: "اللَّهُمَّ بَارِكْ لَهُمَا وَبَارِكْ عَلَيْهِمَا",
    translation: "O Allah, bless them and bestow blessings upon them.",
  },
  {
    id: 4,
    arabic: "اللَّهُمَّ أَلِّفْ بَيْنَ قُلُوبِهِمَا وَاجْعَلْ فِي قُلُوبِهِمَا الْمَحَبَّةَ",
    translation: "O Allah, unite their hearts and place love between them.",
  },
  {
    id: 5,
    arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ",
    translation:
      "Our Lord, accept this from us. Indeed You are the Hearing, the Knowing.",
  },
];

export const MOCK_EVENT_STATS = {
  duas_assigned: 42,
  photos_uploaded: 128,
  messages_count: 67,
  votes_count: 201,
  videos_count: 38,
};

/** Deterministic dua pick from guest token (stable per guest). */
export function pickMockDua(guestToken: string): MockDua {
  let hash = 0;
  for (let i = 0; i < guestToken.length; i += 1) {
    hash = (hash + guestToken.charCodeAt(i) * (i + 1)) % MOCK_DUA_POOL.length;
  }
  return MOCK_DUA_POOL[hash]!;
}
