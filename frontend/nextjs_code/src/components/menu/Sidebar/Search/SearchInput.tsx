import React from "react";

interface Props {
	value: string;
	onChange: (v: string) => void;
}

export default function SearchInput({ value, onChange }: Props) {
	return (
		<input
			type="text"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder="Search items by name or description…"
			aria-label="Search menu items"
			className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
		/>
	);
}
