"use client";

import { IMenuCategory } from "@/types/menu";
import SidebarItem from "./SidebarItem";
import useActiveCategory from "./useActiveCategory";

type Props = {
	categories: IMenuCategory[];
	onItemClick?: () => void;
};

export default function SidebarList({ categories, onItemClick }: Props) {
	const active = useActiveCategory(categories.map((c) => c.title));

	return (
		<ul className="space-y-1 px-2 py-1">
			{categories.map((cat) => (
				<SidebarItem
					key={cat.title}
					title={cat.title}
					active={active === toAnchorId(cat.title)}
					onClick={onItemClick}
				/>
			))}
		</ul>
	);
}

import { toAnchorId } from "./toAnchorId";
