import { IMenuCategory } from "@/types/menu";
import CategoryLink from "./CategoryLink";
import DynamicSidebarContainer from "./DynamicSidebarContainer";

interface SidebarViewProps {
	categories: IMenuCategory[];
	isOpen: boolean;
	mobile: boolean;
	onCategoryClick: (title: string) => void;
	activeCategory?: string | null;
}

/**
 * Sidebar View Component
 *
 * Renders the styled sidebar container and category links
 *
 * Features:
 * - Displays all available categories
 * - Highlights active category
 * - Responsive design
 */
export const SidebarView = ({
	categories,
	isOpen,
	onCategoryClick,
	activeCategory,
}: SidebarViewProps) => {
	return (
		<DynamicSidebarContainer visible={isOpen}>
			<div className="p-4">
				<h2 className="font-bold text-sm mb-4 text-center text-gray-800 dark:text-white">
					دسته بندی
				</h2>
				<ul className="space-y-2">
					{categories.map((category) => (
						<li key={category.title}>
							<CategoryLink
								title={category.title}
								onClick={() => onCategoryClick(category.title)}
								isActive={activeCategory === category.title}
							/>
						</li>
					))}
				</ul>
			</div>
		</DynamicSidebarContainer>
	);
};
