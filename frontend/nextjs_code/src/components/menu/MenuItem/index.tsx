import ItemTitle from "./ItemTitle";
import ItemPrice from "./ItemPrice";
import { ItemThumbnail } from "./ItemThumbnail";
import ItemDescription from "./ItemDescription";

interface MenuItemProps {
	title: string;
	description: string;
	price: number;
	thumbnail: string | null;
	index?: number;
}

/**
 * Menu Item Card Component
 * - Server-rendered for SEO
 * - Uses graceful image fallback
 * - Smooth scroll animation
 * - Modern, accessible design
 */
export default function MenuItem({
	title,
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
        p-4 rounded-2xl border border-gray-100 dark:border-gray-700
        shadow-sm hover:shadow-md transition-all duration-300
        opacity-0 animate-fade-in-up scroll-animate
      `}
			style={{
				animationDelay: `${Math.min(index * 40, 300)}ms`,
				animationFillMode: "forwards",
			}}
		>
			{thumbnail && <ItemThumbnail src={thumbnail} alt={title} />}
			<div className="flex-1 min-w-0">
				<ItemTitle>{title}</ItemTitle>
				<ItemPrice price={price} />
				<ItemDescription text={description} />
			</div>
		</article>
	);
}
