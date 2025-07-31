"use client";

interface CategoryLinkProps {
	title: string;
	onClick: () => void;
	isActive?: boolean;
}

/**
 * Category Link Component
 *
 * Displays a clickable category button in the sidebar
 *
 * Features:
 * - Active state styling
 * - Accessibility attributes
 * - Smooth hover transitions
 * - Dark mode support
 */
export default function CategoryLink({
	title,
	onClick,
	isActive = false,
}: CategoryLinkProps) {
	return (
		<button
			onClick={onClick}
			className={`
        w-full text-center px-4 py-2
        text-sm font-medium
        text-gray-100 dark:text-white
        ${
					isActive
						? "bg-white/30 dark:bg-black/30"
						: "bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20"
				}
        rounded-lg
        transition-all duration-200
        whitespace-nowrap
        focus:outline-none focus:ring-2 focus:ring-white/30
      `}
			aria-current={isActive ? "page" : undefined}
		>
			{title}
		</button>
	);
}
