"use client";

import { useState } from "react";
import { IMenuItem } from "@/types/menu";

interface SearchBoxProps {
	items: IMenuItem[];
	onSearchResults: (results: IMenuItem[]) => void;
}

export default function SearchBox({ items, onSearchResults }: SearchBoxProps) {
	const [query, setQuery] = useState("");

	const handleSearch = (searchQuery: string) => {
		setQuery(searchQuery);
		const results = items.filter(
			(item) =>
				item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
		);
		onSearchResults(results);
	};

	return (
		<div className="bg-background p-4 rounded-lg shadow-md mb-4">
			<div className="relative">
				<input
					type="text"
					value={query}
					onChange={(e) => handleSearch(e.target.value)}
					placeholder="جستجو در منو..."
					className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-right"
				/>
				{query && (
					<button
						onClick={() => {
							setQuery("");
							onSearchResults(items);
						}}
						className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
					>
						×
					</button>
				)}
			</div>
		</div>
	);
}
