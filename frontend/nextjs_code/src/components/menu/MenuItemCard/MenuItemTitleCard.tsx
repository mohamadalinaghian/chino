import { highlightText } from "../search/highlight";

interface Props {
	title: string;
	query: string;
}

export default function MenuItemTitle({ title, query }: Props) {
	return (
		<h3
			className="text-[16px] sm:text-[17px] font-bold text-gray-900 tracking-tight"
			itemProp="name"
		>
			{highlightText(title, query)}
		</h3>
	);
}
