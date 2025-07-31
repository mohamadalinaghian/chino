"use client";

import { useState, useMemo } from "react";
import ResponsiveSidebar from "@/components/menu/Sidebar/ResponsiveSidebar";
import SearchToggle from "@/components/SearchToggle";
import Category from "@/components/menu/Category";
import { IMenuCategory, IMenuItem } from "@/types/menu";

interface Props {
	categories: IMenuCategory[];
	items: IMenuItem[];
}

/**
 * MenuPageClient
 * - Client Component
 * - Handles filtering, UI interaction
 */
export default function MenuPageClient({ categories, items }: Props) {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const filteredItems = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;
		return items.filter(
			(item) =>
				item.title.toLowerCase().includes(q) ||
				item.description?.toLowerCase().includes(q),
		);
	}, [items, query]);

	const handleCategoryClick = (title: string) => {
		setActiveCategory(title);
		document
			.getElementById(`category-${title}`)
			?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<>
			<SearchToggle onSearch={setQuery} />

			<div className="flex-col md:flex-row">
				<ResponsiveSidebar
					categories={categories}
					onCategoryClick={handleCategoryClick}
					activeCategory={activeCategory}
				/>
				<main className="flex-1">
					{categories.map((cat) => {
						const catItems = filteredItems.filter(
							(it) => it.category.title === cat.title,
						);
						if (!catItems.length) return null;

						return (
							<Category
								key={cat.title}
								title={cat.title}
								description={cat.description}
								items={catItems}
							/>
						);
					})}

					{!filteredItems.length && query && (
						<div className="text-center py-12">
							<div className="text-gray-500 text-lg mb-2">
								نتیجه ای برای "{query}" یافت نشد
							</div>
							<button
								onClick={() => setQuery("")}
								className="text-amber-600 hover:underline"
							>
								نمایش همه منو
							</button>
						</div>
					)}
				</main>
			</div>
		</>
	);
}
