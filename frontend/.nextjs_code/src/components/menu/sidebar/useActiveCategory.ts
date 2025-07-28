"use client";

import { useEffect, useState } from "react";
import { toAnchorId } from "./toAnchorId";

export default function useActiveCategory(categoryTitles: string[]) {
	const [activeId, setActiveId] = useState<string | null>(null);

	useEffect(() => {
		const handleScroll = () => {
			const positions = categoryTitles.map((title) => {
				const el = document.getElementById(toAnchorId(title));
				if (!el) return { id: "", offset: Infinity };

				const rect = el.getBoundingClientRect();
				return { id: el.id, offset: Math.abs(rect.top - 100) };
			});

			const closest = positions.reduce((a, b) => (a.offset < b.offset ? a : b));

			setActiveId(closest.id);
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [categoryTitles]);

	return activeId;
}
