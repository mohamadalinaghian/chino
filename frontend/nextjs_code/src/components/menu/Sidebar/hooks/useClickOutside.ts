// src/components/menu/Sidebar/hooks/useClickOutside.ts
import { useEffect } from "react";

export const useClickOutside = (
	ref: React.RefObject<HTMLElement>,
	handler: () => void,
	isActive: boolean,
) => {
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				ref.current &&
				!ref.current.contains(event.target as Node) &&
				!(event.target as Element).closest(".sidebar-toggle-button")
			) {
				handler();
			}
		};

		if (isActive) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [ref, handler, isActive]);
};
