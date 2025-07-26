import { IMenuCategory, IMenuItem } from "@/types/menu";
import MenuItemCard from "./MenuItemCard";
import { toAnchorId } from "@/components/menu/sidebar/toAnchorId";

type Props = {
	category: IMenuCategory;
	items: IMenuItem[];
	query: string;
};

export default function MenuCategorySection({ category, items, query }: Props) {
	const anchorId = toAnchorId(category.title);

	return (
		<section
			id={anchorId}
			className="scroll-mt-28 mb-12"
			aria-labelledby={`category-${anchorId}`}
		>
			<h2
				id={`category-${anchorId}`}
				className="text-xl bg-[#FAF3E0] text-center text-[#5D4037]
        font-bold mb-4 rounded-2xl shadow-lg flex justify-center items-center
        border-neutral-200 hover:scale-105 transition-all duration-300"
			>
				{category.title}
			</h2>

			<div className="flex flex-col gap-4">
				{items.map((item) => (
					<MenuItemCard key={item.title} item={item} query={query} />
				))}
			</div>
		</section>
	);
}
