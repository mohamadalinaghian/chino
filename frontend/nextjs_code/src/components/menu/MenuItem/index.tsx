import ItemImage from "./ItemImage";
import ItemTextContent from "./ItemTextContent";
import ItemDescription from "./ItemDescription";

type Props = {
	item: {
		title: string;
		price: number;
		description: string;
		thumbnail?: string;
	};
};

export default function MenuItemCard({ item }: Props) {
	return (
		<article className="flex flex-col md:flex-row gap-4 p-4 border-b border-gray-100">
			<div className="flex gap-4">
				{item.thumbnail && <ItemImage src={item.thumbnail} alt={item.title} />}
				<ItemTextContent title={item.title} price={item.price} />
			</div>

			{item.description && <ItemDescription description={item.description} />}
		</article>
	);
}
