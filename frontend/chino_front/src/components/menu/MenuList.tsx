"use client";

import { IMenuCategory, IMenuItem } from "@/types/menu";
import MenuCategorySection from "./MenuCategorySection";

interface Props {
  categories: IMenuCategory[];
  items: IMenuItem[];
}

export default function MenuList({ categories, items }: Props) {
  return (
    <div className="space-y-12">
      {categories.map((category) => {
        const itemsInCategory = items.filter(
          (item) => item.category.title === category.title,
        );

        return (
          <MenuCategorySection
            key={category.title}
            category={category}
            items={itemsInCategory}
          />
        );
      })}
    </div>
  );
}
