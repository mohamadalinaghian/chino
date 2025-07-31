"use client";

interface SidebarToggleButtonProps {
	isOpen: boolean;
	onToggle: () => void;
	className?: string;
}

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
        bg-gradient-to-r from-[#ff7676] to-[#f54ea2]
        text-white p-4 rounded-full shadow-xl
        transition-all duration-300 z-50
        focus:outline-none focus:ring-2 focus:ring-[#ffffff60]
        hover:shadow-lg hover:scale-105
        ${className}
      `}
		>
			{isOpen ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-6 w-6"
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
					className="h-6 w-6"
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
