"use client";

import React from "react";
import { IMenuCategory, IMenuItem } from "@/types/menu";
import MenuItemCard from "./MenuItemCard";
import useInView from "@/hooks/useInView";

interface Props {
  category: IMenuCategory;
  items: IMenuItem[];
  query: string;
}

export default function MenuCategorySection({ category, items, query }: Props) {
  const anchorId = encodeURIComponent(category.title);
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      id={anchorId}
      className="mb-10 scroll-mt-32"
      aria-labelledby={`category-${anchorId}`}
    >
      <h2
        className="text-lg font-semibold border-b border-gray-300 pb-2 mb-4"
        id={`category-${anchorId}`}
      >
        {category.title}
      </h2>

      {inView ? (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <MenuItemCard key={item.title} item={item} query={query} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400">در حال بارگذاری...</div>
      )}
    </section>
  );
}
