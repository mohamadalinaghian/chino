import Image from "next/image";

export default function ItemThumbnail({
	src,
	alt,
}: {
	src: string;
	alt: string;
}) {
	const imageLoader = ({ src }: { src: string }) => `${src}?q=100`;

	return (
		<div className="w-24 h-24 relative flex-shrink-0">
			<Image
				src={src}
				alt={alt}
				fill
				className="object-cover rounded-md"
				loader={src ? imageLoader : undefined}
				placeholder="blur"
				blurDataURL="/fallback-thumbnail.webp"
				onError={(e) => {
					(e.target as HTMLImageElement).src = "/fallback-thumbnail.webp";
				}}
			/>
		</div>
	);
}
