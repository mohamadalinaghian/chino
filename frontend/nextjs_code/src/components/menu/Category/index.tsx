// src/components/menu/Category/index.tsx
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

/**
 * Category Component
 * - Server-rendered for optimal SEO
 * - Responsive grid layout
 * - Accessible structure
 * - Staggered animations
 */
export default function Category({ title, description, items }: CategoryProps) {
	return (
		<section
			id={`category-${title}`}
			className="scroll-mt-20 mb-16" // Increased margin for better spacing
			aria-labelledby={`heading-${title}`}
			data-testid="category-section"
		>
			<Header title={title} description={description} />
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
				{items.map((item, idx) => (
					<MenuItem
						key={`${title}-${item.title}-${idx}`}
						title={item.title}
						description={item.description || ""}
						price={item.price || 0}
						thumbnail={item.thumbnail || null}
						index={idx}
					/>
				))}
			</div>
		</section>
	);
}
