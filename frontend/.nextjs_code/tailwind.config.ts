import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";

const config: Config = {
	content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
	theme: {
		extend: {
			colors: {
				cafeCream: "#F5E4C3",
				rustyOrange: "#C57E58",
				espressoBrown: "#4D3727",
				sageGreen: "#A7C4A0",
				mustard: "#D1B873",
			},
			fontFamily: {
				header: ['"Parisienne"', "cursive"],
				body: ["Vazirmatn", "sans-serif"],
			},
			boxShadow: {
				retro: "0 4px 8px rgba(0, 0, 0, 0.1)",
			},
			borderRadius: {
				xl: "1rem",
			},
		},
	},
	plugins: [require("@tailwindcss/line-clamp"), typography, forms],
};

export default config;
