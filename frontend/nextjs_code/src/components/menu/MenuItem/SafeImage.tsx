"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

interface SafeImageProps extends Omit<ImageProps, "src"> {
	/**
	 * The primary image URL
	 */
	src: string;

	/**
	 * Fallback image URL to use if the primary fails
	 * @default "/fallback-thumbnail.webp"
	 */
	fallbackSrc?: string;

	/**
	 * Optional custom loader function if needed
	 */
	loader?: (props: { src: string; width: number; quality?: number }) => string;
}

/**
 * SafeImage component
 *
 * Provides a resilient wrapper around `next/image` with fallback support.
 * Works with dynamic URLs and server-side failures (e.g. 502/404).
 *
 * Usage:
 * ```tsx
 * <SafeImage
 *   src={imageUrl}
 *   alt="Food image"
 *   fill
 *   fallbackSrc="/fallback-thumbnail.webp"
 *   className="object-cover"
 * />
 * ```
 */
export function SafeImage({
	src,
	fallbackSrc = "/fallback-thumbnail.webp",
	loader,
	alt,
	...props
}: SafeImageProps) {
	const [currentSrc, setCurrentSrc] = useState(src);
	const [errored, setErrored] = useState(false);

	// Reset image state when src changes
	useEffect(() => {
		setCurrentSrc(src);
		setErrored(false);
	}, [src]);

	return (
		<Image
			{...props}
			src={errored ? fallbackSrc : currentSrc}
			alt={alt}
			loader={({ src, width, quality }) => {
				const actualSrc = errored ? fallbackSrc : src;
				// If loader function is provided, use it
				return loader ? loader({ src: actualSrc, width, quality }) : actualSrc;
			}}
			onError={() => {
				if (!errored) setErrored(true);
			}}
		/>
	);
}
