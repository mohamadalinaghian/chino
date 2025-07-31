interface DescriptionTextProps {
	text: string;
	maxLines: number;
	expanded: boolean;
}

export default function DescriptionText({
	text,
	maxLines,
	expanded,
}: DescriptionTextProps) {
	return (
		<p
			className="text-gray-600 dark:text-gray-300 text-sm"
			style={{
				display: "-webkit-box",
				WebkitLineClamp: expanded ? undefined : maxLines,
				WebkitBoxOrient: "vertical",
				overflow: "hidden",
			}}
		>
			{text}
		</p>
	);
}
