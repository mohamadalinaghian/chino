"use client";

import { ReactNode } from "react";

type Props = {
	visible: boolean;
	children: ReactNode;
};

export default function DynamicSidebarContainer({ visible, children }: Props) {
	return (
		<nav
			className={`
        fixed bottom-20 left-4 z-40
        rounded-2xl shadow-xl
        border border-[#ffffff20]
        bg-gradient-to-b from-[#2d3436] to-[#1e272e]
        backdrop-blur-sm
        transition-all duration-300
        overflow-y-auto
        max-h-[60vh]
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
        w-auto min-w-[180px] max-w-[300px]
        scrollbar-thin scrollbar-thumb-[#ffffff30] scrollbar-track-transparent
      `}
		>
			{children}
		</nav>
	);
}
