"use client";

import { useState } from "react";

/**
 * ExpandableDescription
 * - Shows 1 line initially with toggle
 * - Persian-friendly typography
 */
export default function ExpandableDescription({ text }: { text: string }) {
	const [expanded, setExpanded] = useState(false);
	const shouldToggle = text.length > 100;

	return (
		<div className="text-center text-sm text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
			<p
				className={`transition-all duration-300 ${expanded ? "" : "line-clamp-1"}`}
			>
				{text}
			</p>
			{shouldToggle && (
				<button
					onClick={() => setExpanded(!expanded)}
					className="text-amber-600 dark:text-amber-400 text-xs mt-1 font-medium hover:underline focus:outline-none"
					aria-expanded={expanded}
				>
					{expanded ? "کمتر" : "بیشتر"}
				</button>
			)}
		</div>
	);
}
