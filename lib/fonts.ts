import localFont from "next/font/local";

/** Mushym — Arabic body, UI, and duas. */
export const fontArabicBody = localFont({
  src: "../public/fonts/Mushym-Regular.ttf",
  variable: "--font-arabic-body",
  display: "swap",
  weight: "400",
});

/** Mushym — ceremonial Arabic titles and eyebrows. */
export const fontArabicDisplay = localFont({
  src: "../public/fonts/Mushym-Regular.ttf",
  variable: "--font-arabic-display",
  display: "swap",
  weight: "400",
});

/** Bilderberg — English titles and body copy. */
export const fontEnglish = localFont({
  src: [
    {
      path: "../public/fonts/Bilderberg OTF.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Bilderberg Italic OTF.otf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-english",
  display: "swap",
});

export const fontVariables = [
  fontArabicBody.variable,
  fontArabicDisplay.variable,
  fontEnglish.variable,
].join(" ");
