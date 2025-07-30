"use client";

export default function ExpandableText({ text }: { text: string }) {
	return (
		<p className="line-clamp-2 sm:line-clamp-3 md:line-clamp-4 break-words">
			{text}
		</p>
	);
}
