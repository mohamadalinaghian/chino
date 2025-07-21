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

export default function MenuItemCard({ item, query }: Props) {
  return (
    <article
      className="flex flex-row gap-4 border-b border-gray-200 py-4 last:border-0 sm:gap-6 hover:bg-gray-50 transition"
      itemScope
      itemType="https://schema.org/Product"
    >
      <MenuItemImage item={item} />

      <div className="flex flex-col justify-between flex-1 min-w-0 overflow-hidden">
        <div>
          <MenuItemTitle title={item.title} query={query} />
          {item.description && (
            <MenuItemDescription
              description={item.description}
              query={query}
            />
          )}
        </div>

        <MenuItemPrice price={item.price} />
      </div>
    </article>
  );
}
