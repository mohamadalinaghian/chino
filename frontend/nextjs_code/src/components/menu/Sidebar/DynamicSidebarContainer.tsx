"use client";

import { ReactNode } from "react";

type Props = {
	visible: boolean;
	children: ReactNode;
};

/**
 * Sidebar Container Component
 * - Renders fixed nav with glass effect
 * - Used by SidebarView
 */
export default function DynamicSidebarContainer({ visible, children }: Props) {
	return (
		<nav
			className={`
        fixed bottom-20 left-4 z-40
        rounded-2xl shadow-xl
        border border-white/20
        bg-gradient-to-br from-[#fdfbff]/90 to-[#f7f1ff]/90 dark:from-[#222428]/90 dark:to-[#2d2f33]/90
        backdrop-blur-xl
        transition-all duration-300 ease-in-out
        overflow-y-auto
        max-h-[60vh]
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
        w-fit max-w-sm
        scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent
      `}
		>
			{children}
		</nav>
	);
}
