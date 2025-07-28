import Image from "next/image";

type Props = {
	src: string;
	alt: string;
};

export default function ItemImage({ src, alt }: Props) {
	return (
		<div className="relative aspect-square h-24 w-24 flex-shrink-0">
			<Image
				src={src}
				alt={alt}
				fill
				className="object-cover rounded-lg"
				sizes="100px"
				loader={({ src }) => `${src}?q=100`}
			/>
		</div>
	);
}
