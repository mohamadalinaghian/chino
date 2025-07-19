"use client";

import { IMenuCategory, IMenuItem } from "@/types/menu";
import MenuItemCard from "./MenuItemCard";

interface Props {
  category: IMenuCategory;
  items: IMenuItem[];
  query: string;
}

export default function MenuCategorySection({ category, items, query }: Props) {
  if (items.length === 0) return null;

  const anchorId = encodeURIComponent(category.title);

  return (
    <section
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

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <MenuItemCard key={item.title} item={item} query={query} />
        ))}
      </div>
    </section>
  );
}
