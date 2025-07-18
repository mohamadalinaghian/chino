"use client";
import { useId } from "react";

type Props = {
  category: { id: string; title: string };
  active: boolean;
  onClick: (id: string) => void;
};

export default function SidebarItem({ category, active, onClick }: Props) {
  const id = useId();
  return (
    <li>
      <button
        role="tab"
        aria-selected={active}
        onClick={() => onClick(category.id)}
        className={`block w-full text-left px-4 py-2 rounded 
          ${active ? "bg-brown-200 font-semibold" : "hover:bg-brown-50"}`}
      >
        {category.title}
      </button>
    </li>
  );
}
