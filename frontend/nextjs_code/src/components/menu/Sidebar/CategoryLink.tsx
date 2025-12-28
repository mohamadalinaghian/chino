"use client";

interface CategoryLinkProps {
	title: string;
	onClick: () => void;
	isActive?: boolean;
}

/**
 * Category Link Component - MINIMAL UPDATE
 * Just updated colors to match dark theme
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
        ${
					isActive
						? "bg-slate-700 text-white"
						: "bg-slate-800/50 text-gray-300 hover:bg-slate-700/70"
				}
        rounded-lg
        transition-all duration-200
        whitespace-nowrap
        focus:outline-none focus:ring-2 focus:ring-slate-600
      `}
			aria-current={isActive ? "page" : undefined}
		>
			{title}
		</button>
	);
}
