"use client";

import { IMenuCategory } from "@/types/menu";
import Sidebar from "./Sidebar";

interface ResponsiveSidebarProps {
	categories: IMenuCategory[];
	onCategoryClick: (title: string) => void;
	activeCategory?: string | null;
}

/**
 * Responsive Sidebar Component
 *
 * Wraps the Sidebar component with responsive behavior
 *
 * Features:
 * - Different layouts for mobile and desktop
 * - Consistent behavior across devices
 */
export default function ResponsiveSidebar({
	categories,
	onCategoryClick,
	activeCategory,
}: ResponsiveSidebarProps) {
	return (
		<>
			{/* Desktop Sidebar */}
			<aside className="hidden md:block md:w-auto md:order-first md:relative">
				<Sidebar
					categories={categories}
					onCategoryClick={onCategoryClick}
					activeCategory={activeCategory}
				/>
			</aside>

			{/* Mobile Sidebar */}
			<div className="md:hidden">
				<Sidebar
					categories={categories}
					onCategoryClick={onCategoryClick}
					mobile
					activeCategory={activeCategory}
				/>
			</div>
		</>
	);
}
