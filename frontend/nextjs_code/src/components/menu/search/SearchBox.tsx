"use client";

import { ChangeEvent } from "react";

type Props = {
	value: string;
	onChange: (val: string) => void;
};

export default function SearchBox({ value, onChange }: Props) {
	return (
		<input
			type="text"
			placeholder="جستجوی نام، توضیحات یا قیمت..."
			value={value}
			onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
			className="w-full text-[#3E3E3E] bg-[#FAF3E0] p-2 rounded
      border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brown-400"
		/>
	);
}
