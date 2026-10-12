import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        sky: { soft: "#7CB9E8" },
        mango: "#FF9A62",
        mint: "#5FCF9C",
        dusk: "#2E2A3B",
        blood: "#B0031B",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        creep: ["Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(15, 23, 42, 0.18)",
        glow: "0 0 40px -8px rgba(176, 3, 27, 0.55)",
      },
    },
  },
  plugins: [],
};
export default config;