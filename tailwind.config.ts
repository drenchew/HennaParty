import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["var(--font-arabic-body)", "Mushym", "serif"],
        "arabic-display": ["var(--font-arabic-display)", "Mushym", "serif"],
        english: ["var(--font-english)", "Bilderberg", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
