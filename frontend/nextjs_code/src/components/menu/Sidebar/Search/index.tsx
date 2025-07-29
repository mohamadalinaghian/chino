// src/components/menu/Sidebar/Search/index.tsx
import React from "react";
import SearchInput from "@/components/menu/Sidebar/Search/SearchInput";
import SearchResetButton from "@/components/menu/Sidebar/Search/SearchResetButton";

interface Props {
	query: string;
	onChange: (v: string) => void;
	onReset: () => void;
}

export default function Search({ query, onChange, onReset }: Props) {
	return (
		<div className="px-2 mb-4 flex items-center">
			<SearchInput value={query} onChange={onChange} />
			{query && <SearchResetButton onReset={onReset} />}
		</div>
	);
}
