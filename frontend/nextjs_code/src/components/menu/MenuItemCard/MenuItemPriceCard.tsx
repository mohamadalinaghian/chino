interface Props {
  price: number;
}

export default function MenuItemPrice({ price }: Props) {
  return (
    <div
      className="text-sm font-semibold text-green-700 mt-2 ltr:text-left rtl:text-right"
      itemProp="offers"
      itemScope
      itemType="https://schema.org/Offer"
    >
      <span itemProp="price">{price}</span>
      <meta itemProp="priceCurrency" content="IRR" />
      <span className="ml-1"> هزار تومان</span>
    </div>
  );
}
