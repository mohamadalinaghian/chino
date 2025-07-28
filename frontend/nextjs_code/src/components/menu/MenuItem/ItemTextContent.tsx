import ItemTitle from "./ItemTitle";
import ItemPrice from "./ItemPrice";

type Props = {
	title: string;
	price: number;
};

export default function ItemTextContent({ title, price }: Props) {
	return (
		<div className="flex flex-col gap-1">
			<ItemTitle title={title} />
			<ItemPrice price={price} />
		</div>
	);
}
