"use client";

import { useState } from "react";

interface SearchToggleProps {
	onSearch: (query: string) => void;
}

/**
 * SearchToggle component
 * - Displays search icon at top-left
 * - Toggles input box visibility
 * - Calls onSearch callback on input change
 */
export default function SearchToggle({ onSearch }: SearchToggleProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	return (
		<div className="fixed top-4 left-4 z-50 flex items-center">
			<button
				aria-label={open ? "Close search" : "Open search"}
				onClick={() => setOpen((v) => !v)}
				className="p-2 bg-amber-500 dark:bg-amber-600 text-white
        rounded-full shadow-lg hover:scale-110 transition-transform"
			>
				🔍
			</button>

			{open && (
				<div className="ml-2">
					<input
						type="text"
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							onSearch(e.target.value);
						}}
						placeholder="جستوجو در آیتم ها..."
						className="px-3 py-2 w-64 bg-amber-200 dark:bg-gray-700 border
            border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-amber-300
            dark:focus:ring-amber-500 transition-colors"
						autoFocus
					/>
				</div>
			)}
		</div>
	);
}
