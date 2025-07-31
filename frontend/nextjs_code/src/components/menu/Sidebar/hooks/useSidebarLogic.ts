import { useState, useRef, useEffect } from "react";
import { IMenuCategory } from "@/types/menu";

export const useSidebarLogic = (
	categories: IMenuCategory[],
	mobile: boolean,
) => {
	const [isOpen, setIsOpen] = useState(true);
	const sidebarRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentWidth, setContentWidth] = useState(250); // مقدار پیشفرض معقول

	const calculateContentWidth = () => {
		if (contentRef.current && isOpen) {
			// محاسبه بر اساس طولانیترین آیتم + padding
			const titleElements = contentRef.current.querySelectorAll("button");
			let maxWidth = 0;

			titleElements.forEach((el) => {
				const styles = window.getComputedStyle(el);
				const padding =
					parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
				const totalWidth = el.scrollWidth + padding;

				if (totalWidth > maxWidth) {
					maxWidth = totalWidth;
				}
			});

			// اضافه کردن فضای برای عنوان و padding کلی
			setContentWidth(Math.min(Math.max(maxWidth + 40, 250), 350)); // محدوده معقول
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
