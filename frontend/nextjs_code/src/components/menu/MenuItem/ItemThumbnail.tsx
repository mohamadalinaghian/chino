"use client";
import { SafeImage } from "./SafeImage";

type Props = {
	src: string;
	alt: string;
	className?: string;
};

/**
 * ItemThumbnail component
 * - Wraps SafeImage with styling
 * - Graceful fallback handling
 * - Responsive and clean visuals
 */
export const ItemThumbnail = ({ src, alt, className = "" }: Props) => {
	return (
		<div
			className={`relative flex-shrink-0 rounded-lg overflow-hidden
        border border-gray-300 dark:border-gray-600 shadow-sm
        w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-gray-100 via-white to-gray-50
        ${className}`}
		>
			<SafeImage
				src={src}
				alt={alt}
				fill
				sizes="(max-width: 640px) 96px, 112px"
				placeholder="blur"
				blurDataURL="/default-thumb-blur.webp"
				className="object-cover transition-transform duration-200 hover:scale-105"
				loader={({ src }) => `${src}?q=90`}
			/>
		</div>
	);
};
