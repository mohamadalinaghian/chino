"use client";

import { IMenuCategory } from "@/types/menu";
import Sidebar from "./Sidebar";

interface ResponsiveSidebarProps {
	categories: IMenuCategory[];
	onCategoryClick: (title: string) => void;
}

export default function ResponsiveSidebar({
	categories,
	onCategoryClick,
}: ResponsiveSidebarProps) {
	return (
		<>
			{/* Desktop Sidebar */}
			<aside className="hidden md:block md:w-1/4 md:order-first">
				<Sidebar categories={categories} onCategoryClick={onCategoryClick} />
			</aside>

			{/* Mobile Sidebar */}
			<div className="md:hidden">
				<Sidebar
					categories={categories}
					onCategoryClick={onCategoryClick}
					mobile
				/>
			</div>
		</>
	);
}
