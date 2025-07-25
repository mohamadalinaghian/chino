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
      className="fixed bottom-6 left-4 z-50 bg-[#B08968] text-white p-2 rounded-full shadow-md md:hidden"
    >
      {open ? <MdClose size={20} /> : <MdMenuOpen size={20} />}
    </button>
  );
}
