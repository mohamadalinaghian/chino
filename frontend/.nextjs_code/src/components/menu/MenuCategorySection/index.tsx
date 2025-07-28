"use client";
import { useRef } from "react";
import { useStickySection } from "./useStickyHeader";
import { IMenuCategory, IMenuItem } from "@/types/menu";
import { CategoryHeader } from "./CategoryHeader";
import { CategoryContent } from "./CategoryContent";
import { toAnchorId } from "@/components/menu/sidebar/toAnchorId";

interface Props {
	category: IMenuCategory;
	items: IMenuItem[];
	query: string;
}

export const MenuCategorySection = ({ category, items, query }: Props) => {
	const sectionRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const { isSticky, isAtBottom } = useStickySection(sectionRef, headerRef, 90);
	const anchorId = toAnchorId(category.title);

	return (
		<section
			id={anchorId}
			ref={sectionRef}
			className="scroll-mt-28 mb-16 bg-transparent group"
			aria-labelledby={`category-${anchorId}`}
		>
			<CategoryHeader
				ref={headerRef}
				category={category}
				isSticky={isSticky}
				isAtBottom={isAtBottom}
			/>
			<CategoryContent items={items} query={query} hasStickyHeader={isSticky} />
			<div className="absolute inset-x-0 bottom-0 h-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
				<div className="h-full w-full bg-gradient-to-t from-[#FAF3D0] to-transparent"></div>
			</div>
		</section>
	);
};
