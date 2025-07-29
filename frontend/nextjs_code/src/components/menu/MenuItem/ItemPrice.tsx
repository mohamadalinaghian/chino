export default function ItemPrice({ price }: { price: number }) {
	return (
		<p className="text-secondary font-medium">
			{price.toLocaleString()} هزار تومان
		</p>
	);
}
