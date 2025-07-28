type Props = {
	price: number;
};

export default function ItemPrice({ price }: Props) {
	return (
		<span className="text-amber-600 font-medium">
			{price.toLocaleString("fa-IR")} هزار تومان
		</span>
	);
}
