import { tailwindTheme } from "./src/theme/tailwind";

export default {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			...tailwindTheme.extend,
			colors: tailwindTheme.colors,
			spacing: tailwindTheme.spacing,
			borderRadius: tailwindTheme.borderRadius,
			boxShadow: tailwindTheme.boxShadow,
			animationDuration: tailwindTheme.animation.duration,
			animationTimingFunction: tailwindTheme.animation.ease,
		},
	},
	plugins: [require("@tailwindcss/line-clamp")],
};
