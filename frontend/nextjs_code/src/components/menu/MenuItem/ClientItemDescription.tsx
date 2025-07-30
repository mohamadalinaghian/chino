"use client";

import { useState } from "react";
import ItemDescription from "./ItemDescription";

export default function ClientItemDescription({ text }: { text: string }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div>
			<ItemDescription text={text} />
			{text.length > 100 && (
				<button
					onClick={() => setExpanded(!expanded)}
					className="text-primary text-xs mt-1 font-medium"
				>
					{expanded ? "نمایش کمتر" : "نمایش بیشتر"}
				</button>
			)}
		</div>
	);
}
