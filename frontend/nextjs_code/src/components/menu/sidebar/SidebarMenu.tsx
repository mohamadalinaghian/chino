"use client";

import { useState } from "react";
import { IMenuCategory } from "@/types/menu";
import SidebarTitle from "./SidebarTitle";
import SidebarList from "./SidebarList";
import ToggleSidebarButton from "./ToggleSidebarButton";
import FloatingSidebarContainer from "./FloatingSidebarContainer";

type Props = {
  categories: IMenuCategory[];
};

export default function SidebarMenu({ categories }: Props) {
  const [open, setOpen] = useState(true);

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <>
      <ToggleSidebarButton open={open} onToggle={() => setOpen(!open)} />

      <FloatingSidebarContainer visible={open}>
        <SidebarTitle />
        <SidebarList categories={categories} onItemClick={handleItemClick} />
      </FloatingSidebarContainer>
    </>
  );
}
