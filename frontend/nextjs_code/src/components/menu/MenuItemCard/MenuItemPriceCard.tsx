interface Props {
  price: number;
}

export default function MenuItemPrice({ price }: Props) {
  return (
    <div
      className="text-sm sm:text-base font-semibold text-emerald-700 mt-2 ltr:text-left rtl:text-right"
      itemProp="offers"
      itemScope
      itemType="https://schema.org/Offer"
    >
      <span className="num" itemProp="price">{price}</span>
      <meta itemProp="priceCurrency" content="IRR" />
      <span className="ml-1"> هزار تومان</span>
    </div>
  );
}
