import ItemTitle from "@/components/menu/MenuItem/ItemTitle";
import ItemPrice from "@/components/menu/MenuItem/ItemPrice";
import ItemThumbnail from "@/components/menu/MenuItem/ItemThumbnail";
import ItemDescription from "@/components/menu/MenuItem/ItemDescription";

interface ItemCardProps {
	title: string;
	price: number;
	description: string;
	thumbnail: string | null;
}

export default function ItemCard({
	title,
	price,
	description,
	thumbnail,
}: ItemCardProps) {
	return (
		<article className="flex items-start gap-4 bg-background p-4 rounded-lg shadow-md animate-fade-in-up">
			{thumbnail && <ItemThumbnail src={thumbnail} alt={title} />}
			<div className="flex-1">
				<ItemTitle>{title}</ItemTitle>
				<ItemPrice price={price} />
				<ItemDescription text={description} />
			</div>
		</article>
	);
}
