"use client";

interface SidebarToggleButtonProps {
	isOpen: boolean;
	onToggle: () => void;
	className?: string;
}

/**
 * Sidebar Toggle Button
 * - Floating action button for toggling sidebar
 * - Harmonized with sidebar's glassy theme
 * - Smooth hover animation
 */
export default function SidebarToggleButton({
	isOpen,
	onToggle,
	className = "",
}: SidebarToggleButtonProps) {
	return (
		<button
			onClick={onToggle}
			aria-label={isOpen ? "بستن منو" : "باز کردن منو"}
			aria-expanded={isOpen}
			className={`
        fixed left-4 bottom-4
        p-3 rounded-full shadow-lg z-50
        text-white dark:text-white
        backdrop-blur-md
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-white/30
        hover:scale-105
        bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] dark:from-[#2d3436] dark:to-[#636e72]
        ${className}
      `}
		>
			{isOpen ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clipRule="evenodd"
					/>
				</svg>
			) : (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
						clipRule="evenodd"
					/>
				</svg>
			)}
		</button>
	);
}
