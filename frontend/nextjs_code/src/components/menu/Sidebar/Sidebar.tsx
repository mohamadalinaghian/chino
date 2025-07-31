"use client";

import { IMenuCategory } from "@/types/menu";
import SidebarToggleButton from "./SidebarToggleButton";
import { useSidebarLogic } from "./hooks/useSidebarLogic";
import { useClickOutside } from "./hooks/useClickOutside";
import { SidebarView } from "./SidebarView";

interface SidebarProps {
	categories: IMenuCategory[];
	onCategoryClick: (title: string) => void;
	activeCategory?: string | null;
	mobile?: boolean;
}

export default function Sidebar({
	categories,
	onCategoryClick,
	activeCategory,
	mobile = false,
}: SidebarProps) {
	const { isOpen, setIsOpen, sidebarRef, toggleSidebar } =
		useSidebarLogic(mobile);

	useClickOutside(sidebarRef, () => setIsOpen(false), isOpen);

	const handleCategoryClick = (title: string) => {
		onCategoryClick(title);
		if (mobile) setIsOpen(false);
	};

	return (
		<nav ref={sidebarRef}>
			<SidebarView
				categories={categories}
				isOpen={isOpen}
				mobile={mobile}
				onCategoryClick={handleCategoryClick}
				activeCategory={activeCategory}
			/>

			<SidebarToggleButton
				isOpen={isOpen}
				onToggle={toggleSidebar}
				className={mobile ? "md:hidden" : "hidden md:block"}
			/>
		</nav>
	);
}
