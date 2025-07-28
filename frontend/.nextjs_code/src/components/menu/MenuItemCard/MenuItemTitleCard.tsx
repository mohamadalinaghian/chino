// src/components/menu/MenuItemCard/MenuItemTitleCard.tsx
import { highlightText } from "../search/highlight";

interface Props {
	title: string;
	query: string;
}

export default function MenuItemTitle({ title, query }: Props) {
	return (
		<h3
			className="text-[16px] sm:text-[17px] font-header
      font-bold text-[#4B2E2B] tracking-tight"
			itemProp="name"
		>
			{highlightText(title, query)}
		</h3>
	);
}
