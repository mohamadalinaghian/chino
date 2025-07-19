import type { Config } from "tailwindcss";
import lineClamp from "@tailwindcss/line-clamp";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "1rem",
        scrollBehavior: ["responsive"],
      },
      fontFamily: {
        vazir: ["Vazirmatn", "sans-serif"],
      },
    },
  },
  plugins: [lineClamp],
};

export default config;
