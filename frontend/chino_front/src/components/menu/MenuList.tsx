"use client";

import { IMenuCategory, IMenuItem } from "@/types/menu";
import MenuCategorySection from "./MenuCategorySection";
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
    <div>
      <div className="sticky top-0 z-30 bg-white py-4 mb-4 shadow-sm">
        <SearchBox value={input} onChange={setInput} />
      </div>

      {!hasResults ? (
        <p className="text-center text-sm text-gray-500 mt-12">
          آیتمی برای نمایش یافت نشد ☕
        </p>
      ) : (
        categories.map((category) => {
          const catItems = filteredItems.filter(
            (item) => item.category.title === category.title,
          );

          if (catItems.length === 0) return null;

          return (
            <MenuCategorySection
              key={category.title}
              category={category}
              items={catItems}
              query={query}
            />
          );
        })
      )}
    </div>
  );
}
