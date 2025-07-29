// src/theme/tailwind.ts
import { theme } from "./index";

export const tailwindTheme = {
	colors: theme.colors,
	spacing: theme.spacing,
	borderRadius: theme.borderRadius,
	boxShadow: theme.boxShadow,
	animation: {
		duration: theme.animation.duration,
		ease: theme.animation.ease,
	},
	extend: {
		keyframes: {
			fadeInUp: {
				"0%": { opacity: "0", transform: "translateY(20px)" },
				"100%": { opacity: "1", transform: "translateY(0)" },
			},
		},
		animation: {
			"fade-in-up": "fadeInUp 0.5s ease-out forwards",
		},
	},
};
