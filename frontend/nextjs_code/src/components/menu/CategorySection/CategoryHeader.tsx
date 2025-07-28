import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

type Props = {
	title: string;
	description?: string;
	isSticky?: boolean;
};

export default function CategoryHeader({
	title,
	description,
	isSticky = false,
}: Props) {
	return (
		<div
			className={`
      bg-white py-3 z-10
      ${isSticky ? "sticky top-0 shadow-sm" : ""}
    `}
		>
			<h2 className="text-xl font-bold text-gray-900">{title}</h2>
			{description && (
				<p className="text-gray-600 text-sm mt-1 line-clamp-2">{description}</p>
			)}
		</div>
	);
}
