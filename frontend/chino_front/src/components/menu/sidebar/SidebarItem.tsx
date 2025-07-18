"use client";

import { toAnchorId } from "./toAnchorId";

type Props = {
  title: string;
  active?: boolean;
  onClick?: () => void;
};

export default function SidebarItem({ title, active, onClick }: Props) {
  const anchorId = toAnchorId(title);

  return (
    <li>
      <a
        href={`#${anchorId}`}
        onClick={onClick}
        className={`block px-2 py-1 text-sm transition font-medium rounded relative
          ${
            active
              ? "text-brown-800 font-bold bg-brown-100"
              : "text-brown-600 hover:text-brown-800"
          }`}
      >
        {title}
        {active && (
          <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-brown-800 rounded-r" />
        )}
      </a>
    </li>
  );
}
