"use client";

import { useState } from "react";

/**
 * Expandable description component for category headers
 * - Client-side interactivity
 * - SEO-friendly collapsed text
 * - Smooth animations
 */
export default function ExpandableDescription({ text }: { text: string }) {
	const [expanded, setExpanded] = useState(false);
	const shouldToggle = text.length > 100;

	return (
		<div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
			<p className={`${expanded ? "" : "line-clamp-1"}`}>{text}</p>
			{shouldToggle && (
				<button
					onClick={() => setExpanded(!expanded)}
					className="text-primary-500 dark:text-primary-400 text-xs mt-1 font-medium hover:underline"
					aria-expanded={expanded}
				>
					{expanded ? "کمتر" : "بیشتر"}
				</button>
			)}
		</div>
	);
}
