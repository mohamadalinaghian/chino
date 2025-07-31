"use client";

import { IMenuCategory } from "@/types/menu";
import SidebarToggleButton from "./SidebarToggleButton";
import { useSidebarLogic } from "./hooks/useSidebarLogic";
import { useClickOutside } from "./hooks/useClickOutside";
import { SidebarView } from "./SidebarView";

interface SidebarProps {
	categories: IMenuCategory[];
	onCategoryClick: (title: string) => void;
	mobile?: boolean;
}

export default function Sidebar({
	categories,
	onCategoryClick,
	mobile = false,
}: SidebarProps) {
	const {
		isOpen,
		setIsOpen,
		sidebarRef,
		contentRef,
		contentWidth,
		toggleSidebar,
	} = useSidebarLogic(categories, mobile);

	useClickOutside(sidebarRef, () => setIsOpen(false), isOpen);

	const handleCategoryClick = (title: string) => {
		onCategoryClick(title);
		if (mobile) setIsOpen(false);
	};

	return (
		<div ref={sidebarRef}>
			<SidebarView
				categories={categories}
				contentRef={contentRef}
				contentWidth={contentWidth}
				isOpen={isOpen}
				mobile={mobile}
				onCategoryClick={handleCategoryClick}
			/>

			{/* نمایش دکمه در همه حالات */}
			<SidebarToggleButton
				isOpen={isOpen}
				onToggle={toggleSidebar}
				className={mobile ? "md:hidden" : "hidden md:block"}
			/>
		</div>
	);
}
