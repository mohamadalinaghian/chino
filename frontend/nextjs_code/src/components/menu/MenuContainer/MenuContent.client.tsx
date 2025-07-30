"use client";

import ResponsiveSidebar from "@/components/menu/Sidebar/ResponsiveSidebar";
import Category from "@/components/menu/Category";
import { IMenuCategory, IMenuItem } from "@/types/menu";

interface MenuContentProps {
	categories: IMenuCategory[];
	menuItems: IMenuItem[];
}

export default function MenuContent({
	categories,
	menuItems,
}: MenuContentProps) {
	const getCategoriesItems = (categoryTitle: string): IMenuItem[] => {
		return menuItems.filter((item) => item.category.title === categoryTitle);
	};

	const handleCategoryClick = (title: string) => {
		const element = document.getElementById(`category-${title}`);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<div className="flex-col md:flex-row">
			<ResponsiveSidebar
				categories={categories}
				onCategoryClick={handleCategoryClick}
			/>

			<main className="flex-1">
				{categories.map((category) => (
					<Category
						key={category.title}
						id={`category-${category.title}`}
						title={category.title}
						description={category.description || null}
						items={getCategoriesItems(category.title)}
					/>
				))}
			</main>
		</div>
	);
}
