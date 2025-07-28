"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const DescriptionText = dynamic(() => import("./DescriptionText"), {
	ssr: true,
});

type Props = {
	description: string;
};

export default function ItemDescription({ description }: Props) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="md:pl-28">
			<DescriptionText description={description} isExpanded={expanded} />
			{description.length > 60 && (
				<button
					onClick={() => setExpanded(!expanded)}
					className="text-amber-500 text-xs mt-1"
				>
					{expanded ? "کمتر" : "بیشتر"}
				</button>
			)}
		</div>
	);
}
