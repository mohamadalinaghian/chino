"use client";
import { useState } from "react";
interface ExpandButtonProps {
	text: string;
	maxLines: number;
	onExpandChange: (expanded: boolean) => void;
}
export default function ExpandButton({
	text,
	maxLines,
	onExpandChange,
}: ExpandButtonProps) {
	const [expanded, setExpanded] = useState(false);
	const needsExpand =
		text.split(/\r?\n/).length > maxLines || text.length > 100;
	if (!needsExpand) return null;
	return (
		<button
			onClick={() => {
				setExpanded((x) => {
					onExpandChange(!x);
					return !x;
				});
			}}
			className="text-amber-400 dark:text-amber-500 text-xs font-medium hover:underline"
			aria-expanded={expanded}
		>
			{expanded ? "کمتر" : "بیشتر"}
		</button>
	);
}
