import { Amiri, Aref_Ruqaa, Cormorant_Garamond } from "next/font/google";

/** Classical Naskh — readable Arabic body, duas, and UI copy. */
export const fontArabicBody = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-arabic-body",
  display: "swap",
});

/** Ruqaa-inspired display face — ceremonial titles and eyebrows in Arabic. */
export const fontArabicDisplay = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-arabic-display",
  display: "swap",
});

/** Warm serif for English — pairs with gold/cream henna palette. */
export const fontEnglish = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-english",
  display: "swap",
});

export const fontVariables = [
  fontArabicBody.variable,
  fontArabicDisplay.variable,
  fontEnglish.variable,
].join(" ");
