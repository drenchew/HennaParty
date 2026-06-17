import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["var(--font-arabic-body)", "Amiri", "Noto Naskh Arabic", "serif"],
        "arabic-display": ["var(--font-arabic-display)", "Aref Ruqaa", "Amiri", "serif"],
        english: ["var(--font-english)", "Cormorant Garamond", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
