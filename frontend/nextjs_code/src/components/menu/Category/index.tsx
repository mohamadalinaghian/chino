import Header from "./Header";
import MenuItem from "@/components/menu/MenuItem";

interface CategoryProps {
	title: string;
	description?: string | null;
	items: {
		title: string;
		description?: string | null;
		price?: number;
		thumbnail?: string | null;
	}[];
}

export default function Category({ title, description, items }: CategoryProps) {
	return (
		<section
			id={`category-${title}`}
			className="scroll-mt-16 mb-8"
			aria-labelledby={`heading-${title}`}
		>
			<Header title={title} description={description} />
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
				{items.map((item, idx) => (
					<MenuItem
						key={`${title}-${idx}`}
						title={item.title}
						description={item.description || ""}
						price={item.price || 0}
						thumbnail={item.thumbnail || null}
					/>
				))}
			</div>
		</section>
	);
}
