import { useState, useRef, useEffect } from "react";
import { IMenuCategory } from "@/types/menu";

export const useSidebarLogic = (
	categories: IMenuCategory[],
	mobile: boolean,
) => {
	const [isOpen, setIsOpen] = useState(true);
	const sidebarRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentWidth, setContentWidth] = useState(0);

	const calculateContentWidth = () => {
		if (contentRef.current && isOpen) {
			const items = contentRef.current.querySelectorAll("button");
			let maxWidth = 0;

			items.forEach((item) => {
				const itemWidth = item.scrollWidth;
				if (itemWidth > maxWidth) maxWidth = itemWidth;
			});

			setContentWidth(maxWidth + 10); // 10px for padding
		}
	};

	useEffect(() => {
		calculateContentWidth();
		window.addEventListener("resize", calculateContentWidth);

		return () => {
			window.removeEventListener("resize", calculateContentWidth);
		};
	}, [isOpen, categories, mobile]);

	const toggleSidebar = () => {
		setIsOpen((prev) => !prev);
	};

	return {
		isOpen,
		setIsOpen,
		sidebarRef,
		contentRef,
		contentWidth,
		toggleSidebar,
	};
};
