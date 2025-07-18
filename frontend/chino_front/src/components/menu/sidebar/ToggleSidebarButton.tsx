"use client";

import { MdMenuOpen, MdClose } from "react-icons/md";

type Props = {
  open: boolean;
  onToggle: () => void;
};

export default function ToggleSidebarButton({ open, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-9 left-2 z-50 bg-brown-100 p-2 rounded-full shadow-md md:hidden"
      aria-label="Toggle sidebar"
    >
      {open ? <MdClose size={24} /> : <MdMenuOpen size={24} />}
    </button>
  );
}
