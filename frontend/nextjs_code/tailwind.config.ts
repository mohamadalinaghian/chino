import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Vazirmatn", "sans-serif"],
			},
			colors: {
				chino: {
					background: "#FAF3E0",
					text: "#3E3E3E",
					title: "#6F4E37",
					price: "#2E7D32",
					card: "#FDF6ED",
					hover: "#EADBC8",
				},
			},
		},
	},
	plugins: [require("@tailwindcss/line-clamp")],
};

export default config;
