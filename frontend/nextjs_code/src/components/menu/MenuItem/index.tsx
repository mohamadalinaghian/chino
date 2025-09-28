import ItemTitle from "./ItemTitle";
import ItemPrice from "./ItemPrice";
import { ItemThumbnail } from "./ItemThumbnail";
import ItemDescription from "./ItemDescription";

interface MenuItemProps {
	name: string;
	description: string;
	price: number;
	thumbnail: string | null;
	index?: number;
}

/**
 * MenuItem component
 * - Responsive horizontal layout (thumbnail + info block)
 * - Modern animation & spacing
 * - Clear price coloring
 * - Light hover interaction
 */
export default function MenuItem({
	name,
	description,
	price,
	thumbnail,
	index = 0,
}: MenuItemProps) {
	return (
		<article
			className={`
        flex items-start gap-4
        bg-white dark:bg-gray-800
        p-5 rounded-2xl shadow-md
        border border-gray-200 dark:border-gray-700
        transition-transform duration-300
        hover:shadow-lg hover:-translate-y-[2px]
        hover:bg-gray-50 dark:hover:bg-gray-700
        opacity-0 animate-fade-in-up scroll-animate
      `}
			style={{
				animationDelay: `${Math.min(index * 50, 300)}ms`,
				animationFillMode: "forwards",
			}}
		>
			{thumbnail && <ItemThumbnail src={thumbnail} alt={name} />}

			<div className="flex-1 min-w-0">
				<ItemTitle>{name}</ItemTitle>
				{price > 0 && <ItemPrice price={price} />}
				<ItemDescription text={description} />
			</div>
		</article>
	);
}
