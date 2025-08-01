export default function ItemPrice({ price }: { price: number }) {
	/**
	 * Display price of the item in Persian Toman format
	 * - If price is zero, returns null
	 */

	return (
		<p
			className="
        text-amber-300 dark:text-amber-400/80
        font-semibold text-sm mb-2
      "
		>
			{new Intl.NumberFormat("fa-IR").format(price)} هزار تومان
		</p>
	);
}
