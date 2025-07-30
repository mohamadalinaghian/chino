"use client";
import Image from "next/image";
import { useState } from "react";

type Props = { src: string; alt: string };
export default function ItemThumbnail({ src, alt }: Props) {
	const [errored, setErrored] = useState(false);
	const finalSrc = errored ? "/fallback-thumbnail.webp" : src;

	return (
		<div className="w-24 h-24 relative flex-shrink-0">
			<Image
				src={finalSrc}
				alt={alt}
				fill
				sizes="(max-width: 768px) 96px, 110px"
				className="object-cover rounded-md"
				loader={({ src }) => `${src}?q=100`}
				placeholder="blur"
				blurDataURL="/fallback-thumbnail.webp"
				onError={() => setErrored(true)}
			/>
		</div>
	);
}
