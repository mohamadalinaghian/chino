// src/hooks/useStickySection.ts
import { useEffect, useState, RefObject } from "react";

export const useStickySection = (
	sectionRef: RefObject<HTMLElement>,
	headerRef: RefObject<HTMLElement>,
	offset = 90,
) => {
	const [isSticky, setIsSticky] = useState(false);
	const [isAtBottom, setIsAtBottom] = useState(false);

	useEffect(() => {
		const section = sectionRef.current;
		const header = headerRef.current;
		if (!section || !header) return;

		const headerHeight = header.offsetHeight;
		const sectionHeight = section.offsetHeight;

		const handleScroll = () => {
			const sectionRect = section.getBoundingClientRect();
			const isInView =
				sectionRect.top <= offset && sectionRect.bottom >= headerHeight;

			if (isInView) {
				setIsSticky(true);
				// بررسی آیا به انتهای بخش رسیدهایم؟
				setIsAtBottom(sectionRect.bottom <= headerHeight + offset);
			} else {
				setIsSticky(false);
				setIsAtBottom(false);
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll(); // فراخوانی اولیه

		return () => window.removeEventListener("scroll", handleScroll);
	}, [sectionRef, headerRef, offset]);

	return { isSticky, isAtBottom };
};
