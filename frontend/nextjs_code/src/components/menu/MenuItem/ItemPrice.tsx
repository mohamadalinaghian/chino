export default function ItemPrice({ price }: { price: number }) {
	return (
		<p
			className="
      text-primary-600 dark:text-primary-400
      font-medium mb-2
    "
		>
			{new Intl.NumberFormat("fa-IR", {
				style: "currency",
				currency: "IRR",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).format(price)}
		</p>
	);
}
