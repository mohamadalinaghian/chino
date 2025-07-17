"use client";

import { IMenuCategory, IMenuItem } from "@/types/menu";
import MenuItemCard from "./MenuItemCard";

interface Props {
  category: IMenuCategory;
  items: IMenuItem[];
}

export default function MenuCategorySection({ category, items }: Props) {
  // if (items.length === 0) return null;

  return (
    <section className="mb-10" aria-labelledby={`category-${category.title}`}>
      <h2
        id={`category-${category.title}`}
        className="text-lg font-semibold border-b border-gray-300 pb-2 mb-4"
      >
        {category.title}
      </h2>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <MenuItemCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}
