// src/components/menu/MenuItemCard/MenuItemImageCard.tsx
import Image from "next/image";
import { useState } from "react";
import { IMenuItem } from "@/types/menu";

interface Props {
	item: IMenuItem;
}

export default function MenuItemImage({ item }: Props) {
	const [hasError, setHasError] = useState(false);
	const encodedUrl: string | null =
		item.thumbnail != null
			? encodeURI(item.thumbnail)
			: "/fallback-thumbnail.webp";

	return (
		<div
			className="relative m-2 w-[96px] sm:w-[110px] aspect-square
      rounded-xl overflow-hidden bg-[#A7C4A0] flex items-center
      justify-center text-#4D3727 text-xs"
		>
			{hasError ? (
				<span className="text-center p-2">{item.title}</span>
			) : (
				<Image
					src={
						"https://chinocafe.ir/media/menu/thumbnails/2025/07/28/7590ae35d782.webp"
					}
					alt={item.title}
					fill
					sizes="(max-width: 768px) 96px, 110px"
					className="object-cover object-center"
					onError={() => setHasError(true)}
				/>
			)}
		</div>
	);
}
