"use client";
import Image from "next/image";
import { useState } from "react";
import { IMenuItem } from "@/types/menu";

interface Props {
	item: IMenuItem;
}

export default function MenuItemImage({ item }: Props) {
	const [hasError, setHasError] = useState(false);

	// تابع بهبودیافته برای مدیریت تمام حالات
	const getImageSource = () => {
		if (!item.thumbnail || hasError) {
			return "/fallback-thumbnail.webp";
		}
		return item.thumbnail;
	};

	const imageLoader = ({ src }: { src: string }) => {
		return `${src}?q=100&t=${Date.now()}`; // اضافه کردن timestamp برای جلوگیری از کش
	};

	return (
		<div className="relative m-2 w-[96px] sm:w-[110px] aspect-square rounded-xl overflow-hidden bg-[#A7C4A0] flex items-center justify-center text-#4D3727 text-xs">
			<Image
				loader={item.thumbnail ? imageLoader : undefined} // فقط برای تصاویر واقعی loader فعال شود
				src={getImageSource()}
				alt={item.title}
				fill
				sizes="(max-width: 768px) 96px, 110px"
				className="object-cover object-center"
				onError={() => setHasError(true)}
				unoptimized={!item.thumbnail} // برای تصاویر فالبک بهینهسازی غیرفعال
			/>
		</div>
	);
}
