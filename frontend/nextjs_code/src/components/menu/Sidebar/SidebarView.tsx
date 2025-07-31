import { IMenuCategory } from "@/types/menu";
import CategoryLink from "./CategoryLink";
import DynamicSidebarContainer from "./DynamicSidebarContainer";

interface SidebarViewProps {
	categories: IMenuCategory[];
	isOpen: boolean;
	mobile: boolean;
	onCategoryClick: (title: string) => void;
}

export const SidebarView = ({
	categories,
	isOpen,
	onCategoryClick,
}: SidebarViewProps) => {
	return (
		<DynamicSidebarContainer visible={isOpen}>
			<div className="p-4">
				<h2 className="font-bold text-lg mb-4 text-center text-white/90 whitespace-nowrap">
					دسته بندی
				</h2>
				<ul className="space-y-2">
					{categories.map((category) => (
						<li key={category.title}>
							<CategoryLink
								title={category.title}
								onClick={() => onCategoryClick(category.title)}
							/>
						</li>
					))}
				</ul>
			</div>
		</DynamicSidebarContainer>
	);
};
