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
        text-sm font-medium
        text-white/90 hover:text-white
        bg-[#ffffff08] hover:bg-[#ffffff15]
        rounded-lg
        transition-all duration-200
        whitespace-nowrap
        focus:outline-none focus:ring-2 focus:ring-[#ffffff40]
      `}
		>
			{title}
		</button>
	);
}
