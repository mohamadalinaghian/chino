import MenuItemCard from "../MenuItem";

type Props = {
	items: Array<{
		id: string;
		title: string;
		price: number;
		description?: string;
		thumbnail?: string;
	}>;
};

export default function CategoryItems({ items }: Props) {
	return (
		<div className="space-y-4">
			{items.map((item) => (
				<MenuItemCard key={item.id} item={item} />
			))}
		</div>
	);
}
