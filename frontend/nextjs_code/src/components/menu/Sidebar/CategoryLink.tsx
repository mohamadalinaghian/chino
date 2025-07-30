"use client";

interface CategoryLinkProps {
	title: string;
	onClick: () => void;
}

export default function CategoryLink({ title, onClick }: CategoryLinkProps) {
	return (
		<button
			onClick={onClick}
			className={`
        w-full text-center px-4 py-2 
        text-sm text-gray-950 dark:text-gray-200
        hover:text-primary-600 dark:hover:text-primary-400
        hover:bg-gray-100 dark:hover:bg-gray-700
        rounded-md transition-all duration-200
        whitespace-nowrap
        focus:outline-none focus:ring-2 focus:ring-primary-500
      `}
		>
			{title}
		</button>
	);
}
