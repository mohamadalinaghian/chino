import { useState, useEffect, useRef } from "react";
import { highlightText } from "../search/highlight";

interface Props {
	description: string;
	query: string;
}

export default function MenuItemDescription({ description, query }: Props) {
	const [expanded, setExpanded] = useState(false);
	const [clamped, setClamped] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			const el = ref.current;
			setClamped(el.scrollHeight > el.clientHeight + 1);
		}
	}, []);

	return (
		<div className="text-sm text-gray-700 leading-relaxed mt-1">
			<div
				ref={ref}
				className={`transition-all duration-300 whitespace-pre-wrap break-words ${
					expanded ? "" : "line-clamp-2"
				}`}
			>
				{highlightText(description, query)}
			</div>

			{clamped && (
				<button
					onClick={() => setExpanded((prev) => !prev)}
					className="text-xs text-blue-500 hover:underline mt-1"
				>
					{expanded ? "کمتر" : "بیشتر"}
				</button>
			)}
		</div>
	);
}
