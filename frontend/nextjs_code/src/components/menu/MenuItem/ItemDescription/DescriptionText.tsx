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
			className="text-gray-500 dark:text-gray-300 text-sm leading-relaxed"
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
