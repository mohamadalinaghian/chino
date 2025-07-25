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
      className="flex gap-4 sm:gap-6 md:gap-8 border border-gray-200 rounded-xl overflow-hidden bg-white p-4 shadow-sm hover:shadow transition duration-300"
      itemScope
      itemType="https://schema.org/Product"
    >
      <MenuItemImage item={item} />

      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <MenuItemTitle title={item.title} query={query} />
          {item.description && (
            <MenuItemDescription description={item.description} query={query} />
          )}
        </div>

        <MenuItemPrice price={item.price} />
      </div>
    </article>
  );
}
