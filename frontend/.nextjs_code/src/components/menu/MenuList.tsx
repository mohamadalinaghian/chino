"use client";

import { IMenuCategory, IMenuItem } from "@/types/menu";
import { MenuCategorySection } from "./MenuCategorySection";
import SearchBox from "./search/SearchBox";
import useSearchQuery from "./search/useSearchQuery";
import { filterMenuItems } from "./search/SearchResultFilter";

type Props = {
	categories: IMenuCategory[];
	items: IMenuItem[];
};

export default function MenuList({ categories, items }: Props) {
	const { input, query, setInput } = useSearchQuery();
	const filteredItems = filterMenuItems(items, query);

	const hasResults = categories.some((category) =>
		filteredItems.some((item) => item.category.title === category.title),
	);

	return (
		<div className="max-w-4xl mx-auto px-4 pb-12">
			<div className="sticky top-0 z-30 bg-gradient-to-b from-[#FAF3D0] to-transparent py-4 mb-4">
				<SearchBox value={input} onChange={setInput} />
			</div>

			{!hasResults ? (
				<p className="text-center text-sm text-gray-500 mt-12">
					آیتمی برای نمایش یافت نشد ☕
				</p>
			) : (
				<div className="space-y-20">
					{" "}
					{/* افزایش فاصله */}
					{categories.map((category) => {
						const catItems = filteredItems.filter(
							(item) => item.category.id === category.id,
						);

						return catItems.length > 0 ? (
							<MenuCategorySection
								key={category.id}
								category={category}
								items={catItems}
								query={query}
							/>
						) : null;
					})}
				</div>
			)}
		</div>
	);
}
