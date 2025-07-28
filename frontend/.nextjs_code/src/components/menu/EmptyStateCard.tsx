import { ReactNode } from "react";

interface EmptyStateProps {
	title?: string;
	description?: string;
	icon?: ReactNode;
}

export default function EmptyState({
	title = "موردی برای نمایش وجود ندارد",
	description = "هیچ دادهای در حال حاضر موجود نیست.",
	icon,
}: EmptyStateProps) {
	return (
		<div className="rounded-2xl flex flex-col items-center justify-center text-center text-gray-500 py-20 px-4">
			{icon && <div className="mb-4 text-4xl">{icon}</div>}
			<h2 className="text-lg font-semibold">{title}</h2>
			<p className="text-sm mt-2">{description}</p>
		</div>
	);
}
