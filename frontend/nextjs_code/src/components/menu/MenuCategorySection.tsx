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
      className="scroll-mt-32 mb-10"
      aria-labelledby={`category-${anchorId}`}
    >
      <h2
        id={`category-${anchorId}`}
        className="text-lg font-bold mb-4"
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
