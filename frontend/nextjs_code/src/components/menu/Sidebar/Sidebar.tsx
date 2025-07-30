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

/**
 * Interactive sidebar component with toggle functionality
 * Handles both mobile and desktop views internally
 */
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
		if (mobile) setIsOpen(false); // Auto-close on mobile selection
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

			{/* Only show toggle button on mobile */}
			{mobile && (
				<SidebarToggleButton isOpen={isOpen} onToggle={toggleSidebar} />
			)}
		</div>
	);
}
