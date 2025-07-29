// src/components/menu/Sidebar/CategoryLink.tsx
import React from "react";

interface Props {
	title: string;
	anchorId: string;
	onClick: () => void;
}

export default function CategoryLink({ title, anchorId, onClick }: Props) {
	return (
		<button
			onClick={onClick}
			type="button"
			data-anchor-id={anchorId}
			data-testid={`category-link-${anchorId}`}
			className="block w-full text-left py-1 px-2 text-base text-text-light hover:text-primary transition-colors duration-200"
		>
			{title}
		</button>
	);
}
