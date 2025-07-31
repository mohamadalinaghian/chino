"use client";

import { useState, useMemo, useEffect } from "react";
import SearchToggle from "@/components/SearchToggle";
import Category from "@/components/menu/Category";
import ResponsiveSidebar from "@/components/menu/Sidebar/ResponsiveSidebar";
import { IMenuCategory, IMenuItem } from "@/types/menu";

/**
 * Custom hook to debounce input values
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default: 300ms)
 */
function useDebounce(value: string, delay = 300): string {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

interface MenuContentProps {
	categories: IMenuCategory[];
	menuItems: IMenuItem[];
}

/**
 * MenuContent Component
 *
 * Handles the main menu display including:
 * - Search functionality with debounce
 * - Category filtering
 * - Responsive sidebar navigation
 *
 * Features:
 * - Optimized search with 300ms debounce to prevent excessive filtering
 * - Memoized filtered items to prevent unnecessary re-renders
 * - Active category tracking for better UX
 */
export default function MenuContent({
	categories,
	menuItems,
}: MenuContentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const debouncedQuery = useDebounce(searchQuery, 300);

	const filteredItems = useMemo(() => {
		if (!debouncedQuery.trim()) return menuItems;

		const lower = debouncedQuery.toLowerCase();
		return menuItems.filter((item) => {
			return (
				item.title.toLowerCase().includes(lower) ||
				item.description?.toLowerCase().includes(lower)
			);
		});
	}, [debouncedQuery, menuItems]);

	const handleCategoryClick = (title: string) => {
		setActiveCategory(title);
		document.getElementById(`category-${title}`)?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	return (
		<>
			<SearchToggle onSearch={setSearchQuery} />

			<div className="flex-col md:flex-row">
				<ResponsiveSidebar
					categories={categories}
					onCategoryClick={handleCategoryClick}
					activeCategory={activeCategory}
				/>
				<main className="flex-1">
					{categories.map((category) => {
						const items = filteredItems.filter(
							(it) => it.category.title === category.title,
						);

						if (items.length === 0) return null;

						return (
							<Category
								key={category.title}
								title={category.title}
								description={category.description}
								items={items}
							/>
						);
					})}

					{filteredItems.length === 0 && searchQuery.trim() && (
						<div className="text-center py-12">
							<div className="text-gray-500 text-lg mb-2">
								نتیجه ای برای "{searchQuery}" یافت نشد
							</div>
							<button
								onClick={() => setSearchQuery("")}
								className="text-amber-600 hover:underline"
							>
								نمایش همه منو
							</button>
						</div>
					)}

					{menuItems.length === 0 && (
						<div className="space-y-4">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="skeleton h-24 rounded-xl"></div>
							))}
						</div>
					)}
				</main>
			</div>
		</>
	);
}
