"use client";
import { useState, useEffect } from "react";
import SidebarItem from "./SidebarItem";

type Props = {
  categories: { id: string; title: string }[];
};

export default function Sidebar({ categories }: Props) {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id || "");

  const onClick = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(`category-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <aside className="w-48 shrink-0 sticky top-24 self-start">
      <ul className="space-y-2" role="tablist">
        {categories.map((cat) => (
          <SidebarItem
            key={cat.id}
            category={cat}
            active={cat.id === activeId}
            onClick={onClick}
          />
        ))}
      </ul>
    </aside>
  );
}
