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
          const currentId = visible[0].target.id;
          setActiveId(currentId);
        }
      },
      { rootMargin: "-50% 0px -45% 0px", threshold: 0.2 },
    );

    categoryTitles.forEach((title) => {
      const id = toAnchorId(title);
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categoryTitles]);

  return activeId;
}
