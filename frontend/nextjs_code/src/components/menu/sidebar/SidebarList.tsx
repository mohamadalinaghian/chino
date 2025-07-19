"use client";

import { IMenuCategory } from "@/types/menu";
import SidebarItem from "./SidebarItem";
import useActiveCategory from "./useActiveCategory";

type Props = {
  categories: IMenuCategory[];
  onItemClick?: () => void;
};

export default function SidebarList({ categories, onItemClick }: Props) {
  const titles = categories.map((cat) => cat.title);
  const active = useActiveCategory(titles);

  return (
    <ul className="space-y-2 text-center text-xs">
      {categories.map((category) => (
        <SidebarItem
          key={category.title}
          title={category.title}
          active={active === encodeURIComponent(category.title)}
          onClick={onItemClick}
        />
      ))}
    </ul>
  );
}
