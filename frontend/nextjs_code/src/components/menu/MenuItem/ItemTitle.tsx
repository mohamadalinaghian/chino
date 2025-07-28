type Props = {
	title: string;
};

export default function ItemTitle({ title }: Props) {
	return (
		<h3 className="font-bold text-lg text-gray-900 line-clamp-1">{title}</h3>
	);
}
