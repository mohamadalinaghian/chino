// src/components/menu/Sidebar/SidebarToggleButton.tsx
import React from "react";

interface Props {
	isOpen: boolean;
	onToggle: () => void;
}

export default function SidebarToggleButton({ isOpen, onToggle }: Props) {
	return (
		<button
			onClick={onToggle}
			type="button"
			aria-label="Toggle sidebar"
			className="fixed bottom-4 left-4 bg-primary text-inverted p-3 rounded-full shadow-md focus:outline-none transition-transform hover:scale-105"
		>
			{isOpen ? "×" : "☰"}
		</button>
	);
}
