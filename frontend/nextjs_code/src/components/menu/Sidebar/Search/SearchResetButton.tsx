// src/components/menu/Sidebar/Search/SearchResetButton.tsx
import React from "react";

interface Props {
	onReset: () => void;
}

export default function SearchResetButton({ onReset }: Props) {
	return (
		<button
			onClick={onReset}
			type="button"
			aria-label="Reset search"
			className="ml-2 text-sm text-gray-500 hover:text-gray-700"
		>
			Clear
		</button>
	);
}
