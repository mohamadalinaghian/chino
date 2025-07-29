// src/theme/index.ts
export const theme = {
	colors: {
		primary: {
			DEFAULT: "#3B82F6",
			light: "#93C5FD",
			dark: "#1D4ED8",
		},
		secondary: {
			DEFAULT: "#10B981",
			light: "#6EE7B7",
			dark: "#047857",
		},
		background: {
			DEFAULT: "#FFFFFF",
			dark: "#F3F4F6",
		},
		text: {
			DEFAULT: "#1F2937",
			light: "#6B7280",
			inverted: "#FFFFFF",
		},
		border: "#E5E7EB",
	},
	spacing: {
		xs: "0.25rem",
		sm: "0.5rem",
		md: "1rem",
		lg: "1.5rem",
		xl: "2rem",
	},
	borderRadius: {
		sm: "0.375rem",
		md: "0.5rem",
		lg: "0.75rem",
		full: "9999px",
	},
	boxShadow: {
		sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
		DEFAULT: "0 4px 20px rgba(0, 0, 0, 0.08)",
		md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
	},
	animation: {
		duration: {
			fast: "200ms",
			DEFAULT: "300ms",
			slow: "500ms",
		},
		ease: {
			DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
			bounce: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
		},
	},
};
