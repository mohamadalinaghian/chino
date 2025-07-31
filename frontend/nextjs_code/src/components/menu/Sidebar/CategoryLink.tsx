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
        w-full text-right px-2 py-2
        text-base font-medium
        text-white/90 hover:text-white
        bg-[#ffffff08] hover:bg-[#ffffff15]
        rounded-xl
        transition-all duration-300
        whitespace-nowrap
        border border-[#ffffff15]
        shadow-sm
        focus:outline-none focus:ring-2 focus:ring-[#ffffff40]
        flex items-center justify-end
        group
      `}
		>
			{title}
			<span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-4 w-4"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
						clipRule="evenodd"
					/>
				</svg>
			</span>
		</button>
	);
}
