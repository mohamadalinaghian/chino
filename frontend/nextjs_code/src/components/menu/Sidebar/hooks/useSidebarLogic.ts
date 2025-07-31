import { useState, useRef } from "react";
import { IMenuCategory } from "@/types/menu";

export const useSidebarLogic = (mobile: boolean) => {
	const [isOpen, setIsOpen] = useState(!mobile);
	const sidebarRef = useRef<HTMLDivElement>(null);

	const toggleSidebar = () => {
		setIsOpen((prev) => !prev);
	};

	return {
		isOpen,
		setIsOpen,
		sidebarRef,
		toggleSidebar,
	};
};
