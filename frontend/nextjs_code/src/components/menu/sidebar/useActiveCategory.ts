"use client";

import { useEffect, useState } from "react";
import { toAnchorId } from "./toAnchorId";

export default function useActiveCategory(categoryTitles: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0.1 }
    );

    const elements = categoryTitles.map((title) =>
      document.getElementById(toAnchorId(title))
    );

    elements.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, [categoryTitles]);

  return activeId;
}
