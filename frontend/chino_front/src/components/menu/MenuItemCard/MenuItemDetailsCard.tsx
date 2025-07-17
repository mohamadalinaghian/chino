import { IMenuItem } from "@/types/menu";
import MenuItemExpandableDescription from "./MenuItemExpandableDescriptionCard";

interface Props {
  item: IMenuItem;
}

export default function MenuItemDetails({ item }: Props) {
  return (
    <div className="flex flex-col justify-between flex-1 min-w-0 overflow-hidden">
      <div>
        <h3 className="text-base font-semibold" itemProp="name">
          {item.title}
        </h3>

        {item.description && (
          <MenuItemExpandableDescription description={item.description} />
        )}
      </div>

      <div
        className="text-sm font-semibold text-green-700 mt-2 ltr:text-left rtl:text-right"
        itemProp="offers"
        itemScope
        itemType="https://schema.org/Offer"
      >
        <span itemProp="price">{item.price}</span>
        <meta itemProp="priceCurrency" content="IRR" />
        <span className="ml-1">هزار تومان</span>
      </div>
    </div>
  );
}
