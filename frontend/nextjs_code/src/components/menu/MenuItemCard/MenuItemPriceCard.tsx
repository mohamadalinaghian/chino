interface Props {
	price: number;
}

export default function MenuItemPrice({ price }: Props) {
	if (price == null || price === 0) return null;
	return (
		<div
			className=" text-[#2E7D32]-100 mt-2 rtl:text-right
      ltr:text-left tracking-wider text-base font-bold"
			itemProp="offers"
			itemScope
			itemType="https://schema.org/Offer"
		>
			<span className="num" itemProp="price">
				{price}
			</span>
			<meta itemProp="priceCurrency" content="IRR" />
			<span className="ml-1">هزار تومان</span>
		</div>
	);
}
