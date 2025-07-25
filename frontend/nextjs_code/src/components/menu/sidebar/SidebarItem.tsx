"use client";

import { toAnchorId } from "./toAnchorId";

type Props = {
  title: string;
  active?: boolean;
  onClick?: () => void;
};

export default function SidebarItem({ title, active, onClick }: Props) {
  const anchorId = toAnchorId(title);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${anchorId}`);
    }
    onClick?.();
  };

  return (
    <li>
      <a
        href={`#${anchorId}`}
        onClick={handleClick}
        className={`block px-2 py-1 text-s transition font-medium rounded relative text-center ${
          active ? "bg-brown-200 font-bold" : ""
        }`}
      >
        {title}
      </a>
    </li>
  );
}
