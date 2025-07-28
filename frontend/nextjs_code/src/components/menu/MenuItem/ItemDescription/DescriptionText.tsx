type Props = {
	description: string;
	isExpanded: boolean;
};

export default function DescriptionText({ description, isExpanded }: Props) {
	return (
		<div className="mt-2">
			<p
				className={`text-gray-600 text-sm ${isExpanded ? "" : "line-clamp-2"}`}
			>
				{description}
			</p>
		</div>
	);
}
