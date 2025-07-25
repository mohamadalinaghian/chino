import React from "react";
import { IMenuItem } from "@/types/menu";
import MenuItemImage from "./MenuItemImageCard";
import MenuItemTitle from "./MenuItemTitleCard";
import MenuItemDescription from "./MenuItemDescriptionCard";
import MenuItemPrice from "./MenuItemPriceCard";

interface Props {
  item: IMenuItem;
  query: string;
}

export default React.memo(function MenuItemCard({ item, query }: Props) {
  return (
<article
  className="flex gap-4 p-4 bg-chino-card rounded-xl border border-chino-hover shadow hover:shadow-md transition-shadow"
  itemScope
  itemType="https://schema.org/Product"
>
      <MenuItemImage item={item} />
      <div className="flex flex-col justify-between flex-1 min-w-0 overflow-hidden">
        <div className="space-y-1">
          <MenuItemTitle title={item.title} query={query} />
          {item.description && (
            <MenuItemDescription description={item.description} query={query} />
          )}
        </div>
        <MenuItemPrice price={item.price} />
      </div>
    </article>
  );
});
