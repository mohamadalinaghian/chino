"use client";

import { useState, useMemo, useEffect } from "react";
import SearchToggle from "@/components/SearchToggle";
import Category from "@/components/menu/Category";
import ResponsiveSidebar from "@/components/menu/Sidebar/ResponsiveSidebar";
import { IMenuCategory, IMenuItem } from "@/types/menu";

/**
 * Custom hook to debounce input values
 */
function useDebounce(value: string, delay = 300): string {
	const [debouncedValue, setDebouncedValue] = useState(value);
	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(handler);
	}, [value, delay]);
	return debouncedValue;
}

/**
 * Main menu content logic - runs in client only
 */
export default function MenuContent() {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [categories, setCategories] = useState<IMenuCategory[]>([]);
	const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
	const [loading, setLoading] = useState(true);

	const debouncedQuery = useDebounce(searchQuery, 300);

	// 👇 Fetch data client-side
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [catRes, itemsRes] = await Promise.all([
					fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/menu/category/`),
					fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/menu/item/`),
				]);

				const [catData, itemsData] = await Promise.all([
					catRes.json(),
					itemsRes.json(),
				]);

				setCategories(catData);
				setMenuItems(itemsData);
			} catch (err) {
				console.error("خطا در دریافت اطلاعات منو", err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const filteredItems = useMemo(() => {
		if (!debouncedQuery.trim()) return menuItems;

		const lower = debouncedQuery.toLowerCase();
		return menuItems.filter(
			(item) =>
				item.title.toLowerCase().includes(lower) ||
				item.description?.toLowerCase().includes(lower),
		);
	}, [debouncedQuery, menuItems]);

	const handleCategoryClick = (title: string) => {
		setActiveCategory(title);
		document
			.getElementById(`category-${title}`)
			?.scrollIntoView({ behavior: "smooth" });
	};

	// Loading state UI
	if (loading) {
		return (
			<div className="space-y-4">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="skeleton h-24 rounded-xl"></div>
				))}
			</div>
		);
	}

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
								نتیجهای برای "{searchQuery}" یافت نشد
							</div>
							<button
								onClick={() => setSearchQuery("")}
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
