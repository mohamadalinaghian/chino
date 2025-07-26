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
			className="flex p-4 bg-[#F5E4C3] rounded-xl border border-[#C57E58]
      shadow-retro hover:shadow-lg transition-shadow duration-300"
			itemScope
			itemType="https://schema.org/Product"
		>
			<div className="shrink-0 self-start ml-2">
				<MenuItemImage item={item} />
			</div>
			<div className="flex flex-col justify-between flex-1 min-w-0 overflow-hidden pl-4">
				<div className="space-y-1">
					<MenuItemTitle title={item.title} query={query} />
					<MenuItemPrice price={item.price} />
					{item.description && (
						<MenuItemDescription description={item.description} query={query} />
					)}
				</div>
			</div>
		</article>
	);
});
