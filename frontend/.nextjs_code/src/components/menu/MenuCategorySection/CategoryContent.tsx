// src/components/menu/MenuCategorySection/CategoryContent.tsx
import { IMenuItem } from "@/types/menu";
import MenuItemCard from "../MenuItemCard";

interface Props {
	items: IMenuItem[];
	query: string;
	hasStickyHeader?: boolean;
}

export const CategoryContent = ({
	items,
	query,
	hasStickyHeader = false,
}: Props) => (
	<div
		className={`bg-[#FAF3D0] rounded-xl shadow-lg overflow-hidden transition-all ${
			hasStickyHeader ? "pt-28" : ""
		}`}
	>
		<div className="p-4 space-y-6">
			{items.map((item) => (
				<MenuItemCard key={item.id} item={item} query={query} />
			))}
		</div>
	</div>
);
