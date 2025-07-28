"use client";

import { useRef } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import CategoryHeader from "./CategoryHeader";
import CategoryItems from "./CategoryItems";

type Props = {
	category: {
		title: string;
		description?: string;
		items: Array<{
			id: string;
			title: string;
			price: number;
			description?: string;
			thumbnail?: string;
		}>;
	};
};

export default function CategorySection({ category }: Props) {
	const ref = useRef<HTMLDivElement>(null);
	const isIntersecting = useIntersectionObserver(ref);

	return (
		<section ref={ref} className="border-b border-gray-100 last:border-0">
			<CategoryHeader
				title={category.title}
				description={category.description}
				isSticky={!isIntersecting}
			/>
			<CategoryItems items={category.items} />
		</section>
	);
}
