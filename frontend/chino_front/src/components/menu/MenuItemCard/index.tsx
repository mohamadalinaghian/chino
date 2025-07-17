import { IMenuItem } from "@/types/menu";
import MenuItemImage from "@/components/menu/MenuItemCard/MenuItemImageCard";
import MenuItemDetails from "@/components/menu/MenuItemCard/MenuItemDetailsCard";

interface Props {
  item: IMenuItem;
}

export default function MenuItemCard({ item }: Props) {
  return (
    <article
      className="flex flex-row gap-4 border-b border-gray-200 py-4 last:border-0 sm:gap-6"
      itemScope
      itemType="https://schema.org/Product"
    >
      <MenuItemImage item={item} />
      <MenuItemDetails item={item} />
    </article>
  );
}
