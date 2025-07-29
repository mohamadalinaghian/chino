"use client";

import { useState } from "react";

export default function ExpandableToggle() {
	const [expanded, setExpanded] = useState(false);

	return (
		<button
			onClick={() => setExpanded(!expanded)}
			className="text-primary text-xs mt-1 font-medium transition-opacity"
		>
			{expanded ? "نمایش کمتر" : "نمایش بیشتر"}
		</button>
	);
}
