import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/**/*.{js,ts,jsx,tsx}",
		"./app/**/*.{js,ts,jsx,tsx}",
		"./src/styles/**/*.{css}",
	],
	// safelist: [
	// 	"bg-background",
	// 	"bg-background-dark",
	// 	"bg-glass",
	// 	"text-text",
	// 	"text-text-light",
	// 	"text-text-inverted",
	// 	"text-primary",
	// 	"text-primary-dark",
	// 	"bg-primary",
	// 	"bg-primary-600",
	// 	"hover:bg-primary-700",
	// 	"border-border",
	// 	"shadow-md",
	// 	"animate-fade-in-up",
	// ],
	theme: {
		extend: {
			colors: {
				background: "#FAF3D0",
				"background-dark": "#E0D7B9",
				glass: "rgba(255,255,255,0.4)",
				text: "#5D4037",
				"text-light": "#7B5E57",
				"text-inverted": "#FFFFFF",
				primary: {
					DEFAULT: "#FF6F00",
					light: "#FFB74D",
					dark: "#E65100",
					600: "#FB8C00",
					700: "#EF6C00",
				},
				secondary: "#A1887F",
				border: "#D7CCC8",
			},
			fontFamily: {
				sans: ['"Vazirmatn"', "sans-serif"],
			},
			animation: {
				"fade-in-up": "fadeInUp 0.6s ease-out both",
			},
			keyframes: {
				fadeInUp: {
					"0%": { opacity: 0, transform: "translateY(10px)" },
					"100%": { opacity: 1, transform: "translateY(0)" },
				},
			},
		},
	},
	plugins: [require("@tailwindcss/typography"), require("tailwind-scrollbar")],
};

export default config;
