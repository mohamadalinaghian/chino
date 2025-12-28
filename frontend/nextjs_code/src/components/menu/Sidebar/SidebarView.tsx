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
 * Sidebar View Component - MINIMAL UPDATE
 * Just improved styling to match card colors
 */
export const SidebarView = ({
	categories,
	isOpen,
	mobile,
	onCategoryClick,
	activeCategory,
}: SidebarViewProps) => {
	// Desktop sidebar positioning
	if (!mobile) {
		return (
			<aside
				className={`
					hidden md:block
					fixed top-20 left-4 z-30
					w-64 max-h-[calc(100vh-120px)]
					bg-slate-800/95
					backdrop-blur-md
					rounded-2xl
					border border-slate-700/50
					shadow-2xl
					transition-all duration-300
					${isOpen ? "translate-x-0 opacity-100" : "-translate-x-[280px] opacity-0"}
				`}
			>
				<div className="p-4 border-b border-slate-700/50 sticky top-0 bg-slate-800/95 backdrop-blur-md rounded-t-2xl z-10">
					<div className="flex items-center justify-between">
						<h2 className="font-bold text-sm text-gray-100">دسته بندی</h2>
						<button
							onClick={() => {}}
							className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 rounded-lg hover:bg-slate-700/50 transition-colors"
							aria-label="بستن"
						>
							{/* You can add close icon here if needed */}
						</button>
					</div>
				</div>

				<div className="overflow-y-auto p-4 space-y-2 max-h-[calc(100vh-200px)]">
					{categories.map((category) => (
						<CategoryLink
							key={category.title}
							title={category.title}
							onClick={() => onCategoryClick(category.title)}
							isActive={activeCategory === category.title}
						/>
					))}
				</div>
			</aside>
		);
	}

	// Mobile sidebar (original behavior)
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
